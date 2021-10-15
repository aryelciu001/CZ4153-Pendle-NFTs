var PendleItemFactory = artifacts.require("PendleItemFactory");
var PendleLiquidityMiningBaseV2 = artifacts.require("PendleLiquidityMiningBaseV2");
var _governanceManager = "0xfcaFA7D3657004e6C027231D351dAE630F621aCF"
var _pausingManager = "0x0000000000000000000000000000000000000000"
var _whitelist = "0x0000000000000000000000000000000000000000"
var _pendleTokenAddress = "0x6C4597a629E959a6bF89B681aa5328D7f1b66b05"
var _stakeToken = "0x6C4597a629E959a6bF89B681aa5328D7f1b66b05"
var _yieldToken = "0x0000000000000000000000000000000000000000"
var _startTime = Math.floor(((new Date()).getTime()) / 1000) + 60*5 // 5 minutes after run
var _epochDuration = 60
var _vestingEpochs = 1

module.exports = function(deployer) {
  // deployer.deploy(PendleItemFactory);
  // console.log(deployer)
  // console.log(deployer.contracts)
  // deployer.deploy(
  //   PendleLiquidityMiningBaseV2, 
  //   _governanceManager, 
  //   _pausingManager, 
  //   _whitelist, 
  //   _pendleTokenAddress, 
  //   _stakeToken, 
  //   _yieldToken, 
  //   _startTime, 
  //   _epochDuration, 
  //   _vestingEpochs
  // );
};
