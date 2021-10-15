var Pendle = artifacts.require("PENDLE");

module.exports = function(deployer) {
  // deployer.deploy(PendleItemFactory);
  deployer.deploy(
    Pendle, 
    "0xfcaFA7D3657004e6C027231D351dAE630F621aCF", 
    "0xfcaFA7D3657004e6C027231D351dAE630F621aCF", 
    "0xfcaFA7D3657004e6C027231D351dAE630F621aCF", 
    "0xfcaFA7D3657004e6C027231D351dAE630F621aCF", 
    "0xfcaFA7D3657004e6C027231D351dAE630F621aCF"
  );
};