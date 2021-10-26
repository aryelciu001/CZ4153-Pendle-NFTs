const contractName = "PendleItemFactory";
const pendleContractName = "PENDLE";
const pendleLiquidityContractName = "PendleLiquidityMiningBaseV2";
const zeroAddress = "0x0000000000000000000000000000000000000000";

async function main() {
  const [ deployer ] = await ethers.getSigners();
  const deployerAddress = deployer.address;

  console.log("Deploying contracts with the account:", deployerAddress);
  console.log("Account balance (before):", (await deployer.getBalance()).toString());

  let pendleTokenAddress;
  pendleTokenAddress = await deployPendleToken()
  let liquidityMiningAddress
  liquidityMiningAddress = await deployLiquidityMining(pendleTokenAddress)
  console.log(liquidityMiningAddress)

  console.log("Account balance (after):", (await deployer.getBalance()).toString());
}

async function deployPendleToken() {
  return new Promise(async (resolve, reject) => {
    // get account address for deployer
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;

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

async function deployLiquidityMining(pendleTokenAddress) {
  return new Promise(async (resolve, reject) => {
    // get account address for deployer
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;

    // deploy Liquidity mining
    const PendleLiquidityMining = await ethers.getContractFactory(pendleLiquidityContractName);
    const pendleLiquidityMining = await PendleLiquidityMining.deploy(
      deployerAddress, 
      zeroAddress, 
      zeroAddress, 
      pendleTokenAddress, 
      pendleTokenAddress,
      zeroAddress,
      Math.floor(Date.now() / 1000) + 60,
      10,
      10
    );

    resolve(pendleLiquidityMining.address)
  })
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });