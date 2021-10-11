// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../../periphery/WithdrawableV2.sol";
import "../../interfaces/IPendleLiquidityMiningV2.sol";
import "../../interfaces/IPendlePausingManager.sol";
import "../../interfaces/IPendleWhitelist.sol";
import "../../libraries/MathLib.sol";
import "../../libraries/TokenUtilsLib.sol";

/*
- stakeToken is the token to be used to stake into this contract to receive rewards
- yieldToken is the token generated by stakeToken while it's being staked. For example, Sushi's LP
token generates SUSHI(if it's in Onsen program), or Pendle's Aave LP generates aToken
- If there is no yieldToken, it should be set to address(0) to save gas
*/
contract PendleLiquidityMiningBaseV2 is IPendleLiquidityMiningV2, WithdrawableV2, ReentrancyGuard {
    using Math for uint256;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct EpochData {
        uint256 totalStakeUnits;
        uint256 totalRewards;
        uint256 lastUpdated;
        mapping(address => uint256) stakeUnitsForUser;
        mapping(address => uint256) availableRewardsForUser;
    }

    IPendleWhitelist public immutable whitelist;
    IPendlePausingManager public immutable pausingManager;

    uint256 public override numberOfEpochs;
    uint256 public override totalStake;
    mapping(uint256 => EpochData) internal epochData;
    mapping(address => uint256) public override balances;
    mapping(address => uint256) public lastTimeUserStakeUpdated;
    mapping(address => uint256) public lastEpochClaimed;

    address public immutable override pendleTokenAddress;
    address public immutable override stakeToken;
    address public immutable override yieldToken;
    uint256 public immutable override startTime;
    uint256 public immutable override epochDuration;
    uint256 public immutable override vestingEpochs;
    uint256 public constant MULTIPLIER = 10**20;

    // yieldToken-related
    mapping(address => uint256) public override dueInterests;
    mapping(address => uint256) public override lastParamL;
    uint256 public override lastNYield;
    uint256 public override paramL;

    modifier hasStarted() {
        require(_getCurrentEpochId() > 0, "NOT_STARTED");
        _;
    }

    modifier nonContractOrWhitelisted() {
        bool isEOA = !Address.isContract(msg.sender) && tx.origin == msg.sender;
        require(isEOA || whitelist.whitelisted(msg.sender), "CONTRACT_NOT_WHITELISTED");
        _;
    }

    modifier isUserAllowedToUse() {
        (bool paused, ) = pausingManager.checkLiqMiningStatus(address(this));
        require(!paused, "LIQ_MINING_PAUSED");
        require(numberOfEpochs > 0, "NOT_FUNDED");
        require(_getCurrentEpochId() > 0, "NOT_STARTED");
        _;
    }

    constructor(
        address _governanceManager,
        address _pausingManager,
        address _whitelist,
        address _pendleTokenAddress,
        address _stakeToken,
        address _yieldToken,
        uint256 _startTime,
        uint256 _epochDuration,
        uint256 _vestingEpochs
    ) PermissionsV2(_governanceManager) {
        require(_startTime > block.timestamp, "INVALID_START_TIME");
        TokenUtils.requireERC20(_pendleTokenAddress);
        TokenUtils.requireERC20(_stakeToken);
        require(_vestingEpochs > 0, "INVALID_VESTING_EPOCHS");
        // yieldToken can be zero address
        pausingManager = IPendlePausingManager(_pausingManager);
        whitelist = IPendleWhitelist(_whitelist);
        pendleTokenAddress = _pendleTokenAddress;

        stakeToken = _stakeToken;
        yieldToken = _yieldToken;
        startTime = _startTime;
        epochDuration = _epochDuration;
        vestingEpochs = _vestingEpochs;
        paramL = 1;
    }

    /**
    @notice set up emergencyMode by pulling all tokens back to this contract & approve spender to
    spend infinity amount
    */
    function setUpEmergencyMode(address spender, bool) external virtual override {
        (, bool emergencyMode) = pausingManager.checkLiqMiningStatus(address(this));
        require(emergencyMode, "NOT_EMERGENCY");

        (address liqMiningEmergencyHandler, , ) = pausingManager.liqMiningEmergencyHandler();
        require(msg.sender == liqMiningEmergencyHandler, "NOT_EMERGENCY_HANDLER");

        // because we are not staking our tokens anywhere else, we can just approve
        IERC20(pendleTokenAddress).safeApprove(spender, type(uint256).max);
        IERC20(stakeToken).safeApprove(spender, type(uint256).max);
        if (yieldToken != address(0)) IERC20(yieldToken).safeApprove(spender, type(uint256).max);
    }

    /**
    @notice create new epochs & fund rewards for them
    @dev same logic as the function in V1
    */
    function fund(uint256[] calldata rewards) external virtual override onlyGovernance {
        // Once the program is over, it cannot be extended
        require(_getCurrentEpochId() <= numberOfEpochs, "LAST_EPOCH_OVER");

        uint256 nNewEpochs = rewards.length;
        uint256 totalFunded;
        // all the funding will be used for new epochs
        for (uint256 i = 0; i < nNewEpochs; i++) {
            totalFunded = totalFunded.add(rewards[i]);
            epochData[numberOfEpochs + i + 1].totalRewards = rewards[i];
        }

        numberOfEpochs = numberOfEpochs.add(nNewEpochs);
        IERC20(pendleTokenAddress).safeTransferFrom(msg.sender, address(this), totalFunded);
        emit Funded(rewards, numberOfEpochs);
    }

    /**
    @notice top up rewards of exisiting epochs
    @dev almost same logic as the function in V1 without the redundant isFunded check
    */
    function topUpRewards(uint256[] calldata epochIds, uint256[] calldata rewards)
        external
        virtual
        override
        onlyGovernance
    {
        require(epochIds.length == rewards.length, "INVALID_ARRAYS");

        uint256 curEpoch = _getCurrentEpochId();
        uint256 endEpoch = numberOfEpochs;
        uint256 totalTopUp;

        for (uint256 i = 0; i < epochIds.length; i++) {
            require(curEpoch < epochIds[i] && epochIds[i] <= endEpoch, "INVALID_EPOCH_ID");
            totalTopUp = totalTopUp.add(rewards[i]);
            epochData[epochIds[i]].totalRewards = epochData[epochIds[i]].totalRewards.add(
                rewards[i]
            );
        }

        IERC20(pendleTokenAddress).safeTransferFrom(msg.sender, address(this), totalTopUp);
        emit RewardsToppedUp(epochIds, rewards);
    }

    /**
    @notice stake tokens in to receive rewards. It's allowed to stake for others
    @param forAddr the address to stake for
    @dev all staking data will be updated for `forAddr`, but msg.sender will be the one transferring
    tokens in
     */
    function stake(address forAddr, uint256 amount)
        external
        virtual
        override
        nonReentrant
        nonContractOrWhitelisted
        isUserAllowedToUse
    {
        require(forAddr != address(0), "ZERO_ADDRESS");
        require(amount != 0, "ZERO_AMOUNT");
        require(_getCurrentEpochId() <= numberOfEpochs, "INCENTIVES_PERIOD_OVER");

        _settleStake(forAddr, msg.sender, amount);
        emit Staked(forAddr, amount);
    }

    /**
    @notice withdraw tokens from the staking contract. It's allowed to withdraw to an address
    different from msg.sender
    @param toAddr the address to receive all tokens
    @dev all staking data will be updated for msg.sender, but `toAddr` will be the one receiving
    all tokens
    */
    function withdraw(address toAddr, uint256 amount)
        external
        virtual
        override
        nonReentrant
        isUserAllowedToUse
    {
        require(amount != 0, "ZERO_AMOUNT");
        require(toAddr != address(0), "ZERO_ADDRESS");

        _settleWithdraw(msg.sender, toAddr, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
    @notice redeem all available rewards from expired epochs. It's allowed to redeem for others
    @param user the address whose data will be updated & receive rewards
    */
    function redeemRewards(address user)
        external
        virtual
        override
        nonReentrant
        isUserAllowedToUse
        returns (uint256 rewards)
    {
        require(user != address(0), "ZERO_ADDRESS");

        rewards = _beforeTransferPendingRewards(user);
        if (rewards != 0) IERC20(pendleTokenAddress).safeTransfer(user, rewards);
    }

    /**
    @notice redeem all due interests. It's allowed to redeem for others
    @param user the address whose data will be updated & receive due interests
    */
    function redeemDueInterests(address user)
        external
        virtual
        override
        nonReentrant
        isUserAllowedToUse
        returns (uint256 amountOut)
    {
        if (yieldToken == address(0)) return 0;
        require(user != address(0), "ZERO_ADDRESS");

        amountOut = _beforeTransferDueInterests(user);
        amountOut = _pushYieldToken(user, amountOut);
    }

    function updateAndReadEpochData(uint256 epochId, address user)
        external
        override
        nonReentrant
        isUserAllowedToUse
        returns (
            uint256 totalStakeUnits,
            uint256 totalRewards,
            uint256 lastUpdated,
            uint256 stakeUnitsForUser,
            uint256 availableRewardsForUser
        )
    {
        _updatePendingRewards(user);
        return readEpochData(epochId, user);
    }

    function readEpochData(uint256 epochId, address user)
        public
        view
        override
        returns (
            uint256 totalStakeUnits,
            uint256 totalRewards,
            uint256 lastUpdated,
            uint256 stakeUnitsForUser,
            uint256 availableRewardsForUser
        )
    {
        totalStakeUnits = epochData[epochId].totalStakeUnits;
        totalRewards = epochData[epochId].totalRewards;
        lastUpdated = epochData[epochId].lastUpdated;
        stakeUnitsForUser = epochData[epochId].stakeUnitsForUser[user];
        availableRewardsForUser = epochData[epochId].availableRewardsForUser[user];
    }

    /**
    @notice update all reward-related data for user
    @dev to be called before user's stakeToken balance changes
    @dev same logic as the function in V1
    */
    function _updatePendingRewards(address user) internal virtual {
        _updateStakeData();

        // user has not staked before, no need to do anything
        if (lastTimeUserStakeUpdated[user] == 0) {
            lastTimeUserStakeUpdated[user] = block.timestamp;
            return;
        }

        uint256 _curEpoch = _getCurrentEpochId();
        uint256 _endEpoch = Math.min(numberOfEpochs, _curEpoch);

        // if _curEpoch<=numberOfEpochs => the endEpoch hasn't ended yet (since endEpoch=curEpoch)
        bool _isEndEpochOver = (_curEpoch > numberOfEpochs);

        // caching
        uint256 _balance = balances[user];
        uint256 _lastTimeUserStakeUpdated = lastTimeUserStakeUpdated[user];
        uint256 _totalStake = totalStake;
        uint256 _startEpoch = _epochOfTimestamp(_lastTimeUserStakeUpdated);

        // Go through all epochs until now to update stakeUnitsForUser and availableRewardsForEpoch
        for (uint256 epochId = _startEpoch; epochId <= _endEpoch; epochId++) {
            if (epochData[epochId].totalStakeUnits == 0) {
                // in the extreme case of zero staked tokens for this expiry even now,
                // => nothing to do from this epoch onwards
                if (_totalStake == 0) break;
                // nobody stakes anything in this epoch
                continue;
            }
            // updating stakeUnits for users. The logic of this is similar to _updateStakeDataForExpiry
            epochData[epochId].stakeUnitsForUser[user] = epochData[epochId]
            .stakeUnitsForUser[user]
            .add(_calcUnitsStakeInEpoch(_balance, _lastTimeUserStakeUpdated, epochId));

            // all epochs prior to the endEpoch must have ended
            // if epochId == _endEpoch, we must check if the epoch has ended or not
            if (epochId == _endEpoch && !_isEndEpochOver) {
                break;
            }

            // Now this epoch has ended,let's distribute its reward to this user
            // calc the amount of rewards the user is eligible to receive from this epoch
            uint256 rewardsPerVestingEpoch = _calcAmountRewardsForUserInEpoch(user, epochId);

            // Now we distribute this rewards over the vestingEpochs starting from epochId + 1
            // to epochId + vestingEpochs
            for (uint256 i = epochId + 1; i <= epochId + vestingEpochs; i++) {
                epochData[i].availableRewardsForUser[user] = epochData[i]
                .availableRewardsForUser[user]
                .add(rewardsPerVestingEpoch);
            }
        }

        lastTimeUserStakeUpdated[user] = block.timestamp;
    }

    /**
    @notice update staking data for the current epoch
    @dev same logic as the function in V1
    */
    function _updateStakeData() internal virtual {
        uint256 _curEpoch = _getCurrentEpochId();

        // loop through all epochData in descending order
        for (uint256 i = Math.min(_curEpoch, numberOfEpochs); i > 0; i--) {
            uint256 epochEndTime = _endTimeOfEpoch(i);
            uint256 lastUpdatedForEpoch = epochData[i].lastUpdated;

            if (lastUpdatedForEpoch == epochEndTime) {
                break; // its already updated until this epoch, our job here is done
            }

            // if the epoch hasn't been fully updated yet, we will update it
            // just add the amount of units contributed by users since lastUpdatedForEpoch -> now
            // by calling _calcUnitsStakeInEpoch
            epochData[i].totalStakeUnits = epochData[i].totalStakeUnits.add(
                _calcUnitsStakeInEpoch(totalStake, lastUpdatedForEpoch, i)
            );
            // If the epoch has ended, lastUpdated = epochEndTime
            // If not yet, lastUpdated = block.timestamp (aka now)
            epochData[i].lastUpdated = Math.min(block.timestamp, epochEndTime);
        }
    }

    /**
    @notice update all interest-related data for user
    @dev to be called before user's stakeToken balance changes or when user wants to update his
    interests
    @dev same logic as the function in CompoundLiquidityMiningV1
    */
    function _updateDueInterests(address user) internal virtual {
        if (yieldToken == address(0)) return;

        _updateParamL();

        if (lastParamL[user] == 0) {
            lastParamL[user] = paramL;
            return;
        }

        uint256 principal = balances[user];
        uint256 interestValuePerStakeToken = paramL.sub(lastParamL[user]);

        uint256 interestFromStakeToken = principal.mul(interestValuePerStakeToken).div(MULTIPLIER);

        dueInterests[user] = dueInterests[user].add(interestFromStakeToken);
        lastParamL[user] = paramL;
    }

    /**
    @notice update paramL, lastNYield & redeem interest from external sources
    @dev to be called only from _updateDueInterests
    @dev same logic as the function in V1
    */
    function _updateParamL() internal virtual {
        if (yieldToken == address(0) || !_checkNeedUpdateParamL()) return;

        _redeemExternalInterests();

        uint256 currentNYield = IERC20(yieldToken).balanceOf(address(this));
        (uint256 firstTerm, uint256 paramR) = _getFirstTermAndParamR(currentNYield);

        uint256 secondTerm;

        if (totalStake != 0) secondTerm = paramR.mul(MULTIPLIER).div(totalStake);

        // Update new states
        paramL = firstTerm.add(secondTerm);
        lastNYield = currentNYield;
    }

    /**
    @dev same logic as the function in CompoundLiquidityMining
    @dev to be called only from _updateParamL
    */
    function _getFirstTermAndParamR(uint256 currentNYield)
        internal
        virtual
        returns (uint256 firstTerm, uint256 paramR)
    {
        firstTerm = paramL;
        paramR = currentNYield.sub(lastNYield);
    }

    /**
    @dev function is empty because by default yieldToken==0
    */
    function _checkNeedUpdateParamL() internal virtual returns (bool) {}

    /**
    @dev function is empty because by default yieldToken==0
    */
    function _redeemExternalInterests() internal virtual {}

    /**
    @notice Calc the amount of rewards that the user can receive now & clear all the pending
    rewards
    @dev To be called before any rewards is transferred out
    @dev same logic as the function in V1
    */
    function _beforeTransferPendingRewards(address user)
        internal
        virtual
        returns (uint256 amountOut)
    {
        _updatePendingRewards(user);

        uint256 _lastEpoch = Math.min(_getCurrentEpochId(), numberOfEpochs + vestingEpochs);
        for (uint256 i = lastEpochClaimed[user]; i <= _lastEpoch; i++) {
            if (epochData[i].availableRewardsForUser[user] > 0) {
                amountOut = amountOut.add(epochData[i].availableRewardsForUser[user]);
                epochData[i].availableRewardsForUser[user] = 0;
            }
        }

        lastEpochClaimed[user] = _lastEpoch;
        emit PendleRewardsSettled(user, amountOut);
    }

    /**
    @notice Calc the amount of interests that the user can receive now & clear all the due
    interests
    @dev To be called before any interests is transferred out
    @dev same logic as the function in V1
    */
    function _beforeTransferDueInterests(address user)
        internal
        virtual
        returns (uint256 amountOut)
    {
        if (yieldToken == address(0)) return 0;

        _updateDueInterests(user);
        amountOut = Math.min(dueInterests[user], lastNYield);
        dueInterests[user] = 0;
        lastNYield = lastNYield.sub(amountOut);
    }

    /**
    @param user the address whose all stake data will be updated
    @param payer the address which tokens will be pulled from
    @param amount amount of tokens to be staked
    @dev payer is only used to pass to _pullStakeToken
     */
    function _settleStake(
        address user,
        address payer,
        uint256 amount
    ) internal virtual {
        _updatePendingRewards(user);
        _updateDueInterests(user);

        balances[user] = balances[user].add(amount);
        totalStake = totalStake.add(amount);

        _pullStakeToken(payer, amount);
    }

    /**
    @param user the address whose all stake data will be updated
    @param receiver the address which tokens will be pushed to
    @param amount amount of tokens to be withdrawn
    @dev receiver is only used to pass to _pullStakeToken
     */
    function _settleWithdraw(
        address user,
        address receiver,
        uint256 amount
    ) internal virtual {
        _updatePendingRewards(user);
        _updateDueInterests(user);

        balances[user] = balances[user].sub(amount);
        totalStake = totalStake.sub(amount);

        _pushStakeToken(receiver, amount);
    }

    function _pullStakeToken(address from, uint256 amount) internal virtual {
        // For the case that we don't need to stake the stakeToken anywhere else, just pull it
        // into the current contract
        IERC20(stakeToken).safeTransferFrom(from, address(this), amount);
    }

    function _pushStakeToken(address to, uint256 amount) internal virtual {
        // For the case that we don't need to stake the stakeToken anywhere else, just transfer out
        // from the current contract
        if (amount != 0) IERC20(stakeToken).safeTransfer(to, amount);
    }

    function _pushYieldToken(address to, uint256 amount)
        internal
        virtual
        returns (uint256 outAmount)
    {
        outAmount = Math.min(amount, IERC20(yieldToken).balanceOf(address(this)));
        if (outAmount != 0) IERC20(yieldToken).safeTransfer(to, outAmount);
    }

    /**
     @notice returns the stakeUnits in the _epochId(th) epoch of an user if he stake from _startTime to now
     @dev to calculate durationStakeThisEpoch:
       user will stake from _startTime -> _endTime, while the epoch last from _startTimeOfEpoch -> _endTimeOfEpoch
       => the stakeDuration of user will be min(_endTime,_endTimeOfEpoch) - max(_startTime,_startTimeOfEpoch)
     @dev same logic as in V1
     */
    function _calcUnitsStakeInEpoch(
        uint256 _tokenAmount,
        uint256 _startTime,
        uint256 _epochId
    ) internal view returns (uint256 stakeUnitsForUser) {
        uint256 _endTime = block.timestamp;

        uint256 _l = Math.max(_startTime, _startTimeOfEpoch(_epochId));
        uint256 _r = Math.min(_endTime, _endTimeOfEpoch(_epochId));
        uint256 durationStakeThisEpoch = _r.subMax0(_l);

        return _tokenAmount.mul(durationStakeThisEpoch);
    }

    /**
    @notice calc the amount of rewards the user is eligible to receive from this epoch, but we will
    return the amount per vestingEpoch instead
    @dev same logic as in V1
     */
    function _calcAmountRewardsForUserInEpoch(address user, uint256 epochId)
        internal
        view
        returns (uint256 rewardsPerVestingEpoch)
    {
        rewardsPerVestingEpoch = epochData[epochId]
        .totalRewards
        .mul(epochData[epochId].stakeUnitsForUser[user])
        .div(epochData[epochId].totalStakeUnits)
        .div(vestingEpochs);
    }

    function _startTimeOfEpoch(uint256 t) internal view returns (uint256) {
        // epoch id starting from 1
        return startTime.add((t.sub(1)).mul(epochDuration));
    }

    function _getCurrentEpochId() internal view returns (uint256) {
        return _epochOfTimestamp(block.timestamp);
    }

    function _epochOfTimestamp(uint256 t) internal view returns (uint256) {
        if (t < startTime) return 0;
        return (t.sub(startTime)).div(epochDuration).add(1);
    }

    // Although the name of this function is endTimeOfEpoch, it's actually the beginning of the next epoch
    function _endTimeOfEpoch(uint256 t) internal view returns (uint256) {
        // epoch id starting from 1
        return startTime.add(t.mul(epochDuration));
    }

    function _allowedToWithdraw(address _token) internal view override returns (bool allowed) {
        allowed = _token != pendleTokenAddress && _token != stakeToken && _token != yieldToken;
    }
}
