import { expect } from "chai";
import { Signer, ContractFactory, Contract } from "ethers";
import { ethers } from "hardhat";

const pendleItemFactoryContractName: string = "PendleItemFactory";
const pendleContractName: string = "PENDLE";
const pendleLiquidityContractName: string = "PendleLiquidityMiningBaseV2";
const zeroAddress: string = "0x0000000000000000000000000000000000000000";

describe("PendleItemFactory", async function () {
  // accounts
  let owner: Signer; 
  let addr1: Signer; 
  let addr2: Signer;

  // accounts' address
  let ownerAddress: string;
  let addr1Address: string;
  let addr2Address: string;

  // Contract Factory
  let PendleItemFactory: ContractFactory;
  let Pendle: ContractFactory;
  let PendleLiquidityMining: ContractFactory;

  // Contract
  let pendleItemFactoryContract: Contract;
  let pendleContract: Contract;
  let pendleLiquidityMiningContract: Contract;


  it("Should deploy pendle item contract...", async function () {
    PendleItemFactory = await ethers.getContractFactory(pendleItemFactoryContractName);
    pendleItemFactoryContract = await PendleItemFactory.deploy();
    [owner, addr1, addr2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    addr1Address = await addr1.getAddress();
    addr2Address = await addr2.getAddress();
    await pendleItemFactoryContract.deployed();
  }).timeout(10000);
  
  it("Should create new items...", async function () {
    await pendleItemFactoryContract.createNewItem("first");
    await pendleItemFactoryContract.createNewItem("second");
    await pendleItemFactoryContract.createNewItem("third");
  })
  
  it("should transfer items...", async function () {
    // transfer directly from owner to addr1
    await pendleItemFactoryContract["safeTransferFrom(address,address,uint256)"](ownerAddress, addr1Address, 1);
    // approve addr1 to move token 2
    await pendleItemFactoryContract["approve(address,uint256)"](addr1Address, 2);
    // transfer from owner to addr2, called by addr1
    await pendleItemFactoryContract.connect(addr1)["safeTransferFrom(address,address,uint256)"](ownerAddress, addr2Address, 2);
  })

  it("should check owner...", async function () {
    expect(await pendleItemFactoryContract.ownerOf(0)).to.equal(ownerAddress);
    expect(await pendleItemFactoryContract.ownerOf(1)).to.equal(addr1Address);
    expect(await pendleItemFactoryContract.ownerOf(2)).to.equal(await addr2.getAddress());
  })

  it("should deploy PENDLE contract...", async function () {
    Pendle = await ethers.getContractFactory(pendleContractName);
    [owner, addr1, addr2] = await ethers.getSigners();
    pendleContract = await Pendle.deploy(
      ownerAddress, 
      ownerAddress, 
      ownerAddress, 
      ownerAddress, 
      ownerAddress
    );
    await pendleContract.deployed();

    // by now, owner must have 188,700,000 pendle tokens
    let ownerCoin = await pendleContract["balanceOf(address)"](ownerAddress);
    ownerCoin = ethers.utils.formatEther(ownerCoin);
    ownerCoin = Number(ownerCoin);
    expect(ownerCoin).to.equal(188700000);

    // transfer 10 pendle tokens to addr1 
    await pendleContract["transfer(address,uint256)"](addr1Address, ethers.utils.parseEther("10"));
    
    // now addr1 have 10 tokens
    let addr1Coin = await pendleContract["balanceOf(address)"](addr1Address);
    addr1Coin = ethers.utils.formatEther(addr1Coin);
    addr1Coin = Number(addr1Coin);
    expect(addr1Coin).to.equal(10);
  }).timeout(10000);

  it("should deploy PENDLE LIQUIDITY MINING contract...", async function () {
    PendleLiquidityMining = await ethers.getContractFactory(pendleLiquidityContractName);
    pendleLiquidityMiningContract = await PendleLiquidityMining.deploy(
      ownerAddress, // _governanceManager
      ownerAddress, // _pausingManager
      zeroAddress, // _whitelist
      pendleContract.address, // _pendleTokenAddress
      pendleContract.address, // _stakeToken
      zeroAddress, // _yieldToken
      Math.floor(Date.now() / 1000) + 60, // _startTime (in unix, now + 60 seconds)
      60*60*24, // _epochDuration (24 hours)
      5 // _vestingEpochs
    );
    await pendleLiquidityMiningContract.deployed();
  }).timeout(10000);

  it("should stake pendle token...", async function () {
    // allow liquidity mining contract to spend 1000 pendle tokens
    await pendleContract.connect(owner)["approve(address,uint256)"](pendleLiquidityMiningContract.address, ethers.utils.parseEther("1000"))

    // trying to stake
    // await pendleLiquidityMiningContract.connect(addr2)["stake(address,uint256)"](addr2Address, ethers.utils.parseEther("10"))
  });
});
