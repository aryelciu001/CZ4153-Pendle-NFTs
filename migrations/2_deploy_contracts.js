var PendleItemFactory = artifacts.require("PendleItemFactory");

module.exports = function(deployer) {
  deployer.deploy(PendleItemFactory);
};