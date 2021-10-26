import { expect } from "chai";
import { Signer, ContractFactory, Contract } from "ethers";
import { ethers } from "hardhat";

const contractName: string = "PendleItemFactory";
const pendleContractName: string = "PENDLE";
const pendleLiquidityContractName: string = "PendleLiquidityMiningBaseV2";
const zeroAddress: string = "0x0000000000000000000000000000000000000000";

describe("PendleItemFactory", async function () {
  let owner: Signer; 
  let addr1: Signer; 
  let addr2: Signer;
  let PendleItemFactory: ContractFactory;
  let pif: Contract;
  let ownerAddress: string;
  let addr1Address: string;
  let addr2Address: string;
  let pendleTokenAddress: string;
  let liquidityMiningAddress: string;
  
  it("Deploying smart contract...", async function () {
    PendleItemFactory = await ethers.getContractFactory(contractName);
    pif = await PendleItemFactory.deploy();
    [owner, addr1, addr2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    addr1Address = await addr1.getAddress();
    addr2Address = await addr2.getAddress();
    await pif.deployed();
  }).timeout(10000);
  
  it("Create new items...", async function () {
    await pif.createNewItem("first")
    await pif.createNewItem("second")
    await pif.createNewItem("third")
  })
  
  it("Transfer items...", async function () {
    // transfer directly from owner to addr1
    await pif["safeTransferFrom(address,address,uint256)"](ownerAddress, addr1Address, 1)
    // approve addr1 to move token 2
    await pif["approve(address,uint256)"](addr1Address, 2)
    // transfer from owner to addr2, called by addr1
    await pif.connect(addr1)["safeTransferFrom(address,address,uint256)"](ownerAddress, addr2Address, 2)
  })

  it("Check Owner...", async function () {
    expect(await pif.ownerOf(0)).to.equal(ownerAddress)
    expect(await pif.ownerOf(1)).to.equal(addr1Address)
    expect(await pif.ownerOf(2)).to.equal(await addr2.getAddress())
  })

  it("Deploying PENDLE contract...", async function () {
    let Pendle = await ethers.getContractFactory(pendleContractName);
    [owner, addr1, addr2] = await ethers.getSigners();
    pif = await Pendle.deploy(
      ownerAddress, 
      ownerAddress, 
      ownerAddress, 
      ownerAddress, 
      ownerAddress
    );
    pendleTokenAddress = pif.address
    await pif.deployed()

    // by now, owner must have 188,700,000 pendle tokens
    let ownerCoin = await pif["balanceOf(address)"](ownerAddress)
    ownerCoin = ethers.utils.formatEther(ownerCoin)
    ownerCoin = Number(ownerCoin)
    expect(ownerCoin).to.equal(188700000)

    // transfer 10 pendle tokens to addr1 
    await pif["transfer(address,uint256)"](addr1Address, ethers.utils.parseEther("10"))
    
    // now addr1 have 10 tokens
    let addr1Coin = await pif["balanceOf(address)"](addr1Address)
    addr1Coin = ethers.utils.formatEther(addr1Coin)
    addr1Coin = Number(addr1Coin)
    expect(addr1Coin).to.equal(10)
  }).timeout(10000);

  it("Deploying PENDLE LIQUIDITY MINING contract...", async function () {
    let PendleLiquidityMining = await ethers.getContractFactory(pendleLiquidityContractName);
    pif = await PendleLiquidityMining.deploy(
      ownerAddress, 
      ownerAddress, 
      zeroAddress, 
      pendleTokenAddress, 
      pendleTokenAddress,
      zeroAddress,
      Math.floor(Date.now() / 1000) + 60,
      10,
      10
    );
    liquidityMiningAddress = pif.address
    await pif.deployed();
    console.log(ownerAddress, 
      ownerAddress, 
      zeroAddress, 
      pendleTokenAddress, 
      pendleTokenAddress,
      zeroAddress,
      Math.floor(Date.now() / 1000) + 60,
      10,
      10)
  }).timeout(10000);

  // it("Stake pendle token...", async function () {
  //   let stakerAddress = addr2Address
  //   expect(liquidityMiningAddress).to.equal(pif.address)
  //   console.log(stakerAddress, stakerAddress, ethers.utils.parseEther("10"))
  //   // await pif["stake(address,uint256)"](stakerAddress, ethers.utils.parseEther("10"))
  // })
});
