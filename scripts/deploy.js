// Initialize contract names
const pendleItemFactoryContractName = "PendleItemFactory";
const pendleContractName = "PENDLE";
const pendleLiquidityContractName = "PendleLiquidityMiningBaseV2";

async function deployPendleToken(deployerAddress) {
  return new Promise(async (resolve, reject) => {
    // deploy Pendle Token
    const PendleToken = await ethers.getContractFactory(pendleContractName);
    const pendleToken = await PendleToken.deploy(
      deployerAddress, 
      deployerAddress, 
      deployerAddress, 
      deployerAddress, 
      deployerAddress
    );
    resolve(pendleToken.address)
  })
}

async function deployLiquidityMining(deployerAddress, pendleTokenAddress, pendleItemFactoryAddress) {
  return new Promise(async (resolve, reject) => {
    // deploy Liquidity mining
    const PendleLiquidityMining = await ethers.getContractFactory(pendleLiquidityContractName);

    // parameters to deploy liquidity mining
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const _governanceManager = deployerAddress
    const _pausingManager = zeroAddress
    const _whitelist = zeroAddress
    const _pendleTokenAddress = pendleTokenAddress
    const _stakeToken = pendleTokenAddress
    const _yieldToken = zeroAddress
    const _startTime = Math.floor(Date.now() / 1000) + 60 // now + 60 seconds
    const _epochDuration = 60 // 1 minute
    const _vestingEpochs = 5
    const _exchangeRate = 100
    const _pendleItemPointsPerEpoch = 100

    const pendleLiquidityMining = await PendleLiquidityMining.deploy(
      _governanceManager,
      _pausingManager,
      _whitelist,
      _pendleTokenAddress,
      _stakeToken,
      _yieldToken,
      _startTime,
      _epochDuration,
      _vestingEpochs,
      pendleItemFactoryAddress,
      _exchangeRate,
      _pendleItemPointsPerEpoch
    );

    resolve(pendleLiquidityMining.address)
  })
}

async function deployItemFactory() {
  return new Promise(async (resolve, reject) => {
    // deploy Pendle Token
    const PendleItemFactory = await ethers.getContractFactory(pendleItemFactoryContractName);
    const pendleItemFactory = await PendleItemFactory.deploy();

    resolve(pendleItemFactory.address)
  })
}

async function main() {
  // mimic real life by mining new block evert 1 second
  await network.provider.send("evm_setIntervalMining", [1000]);

  // initialize owner address
  const [ deployer, addr1, addr2 ] = await ethers.getSigners();
  const deployerAddress = deployer.address;

  console.log("Deploying contracts with the address:", deployerAddress);
  console.log("Account balance (before):", (await deployer.getBalance()).toString());

  // deploy contracts and get the address
  let pendleTokenAddress = await deployPendleToken(deployerAddress)
  let pendleItemFactoryAddress = await deployItemFactory()
  let pendleLiquidityMiningAddress = await deployLiquidityMining(deployerAddress, pendleTokenAddress, pendleItemFactoryAddress)

  console.log("Account balance (after):", (await deployer.getBalance()).toString());

  // create contract instance to
  // interact with contracts
  const Pendle = await ethers.getContractFactory(pendleContractName);
  const pendle = await Pendle.attach(pendleTokenAddress);

  const PendleItemFactory = await ethers.getContractFactory(pendleItemFactoryContractName);
  const pif = await PendleItemFactory.attach(pendleItemFactoryAddress);

  const PendleLiquidityMining = await ethers.getContractFactory(pendleLiquidityContractName);
  const pendleLQ = await PendleLiquidityMining.attach(pendleLiquidityMiningAddress);

  // approve pendleLiquiditymining contract to transfer NFTs
  await pif.connect(deployer).approveForAll(pendleLQ.address)

  // approve pendleLiquiditymining contract to spend owner's (deployer) pendle token
  await pendle.connect(deployer).approve(pendleLiquidityMiningAddress, ethers.utils.parseEther("100000"))

  // initialize rewards for staking
  const reward = ethers.utils.parseEther("100");
  const rewards = Array(1000).fill(reward);

  // fun pendleLiquiditymining for staking rewards
  await pendleLQ.connect(deployer).fund(rewards);

  // send some pendle to other address for simulation
  await pendle.connect(deployer).transfer(await addr1.getAddress(), ethers.utils.parseEther("10000"))
  await pendle.connect(deployer).transfer(await addr2.getAddress(), ethers.utils.parseEther("10000"))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });