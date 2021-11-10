import { expect } from "chai";
import { Signer, ContractFactory, Contract, BigNumber as BN } from "ethers";
import { ethers } from "hardhat";

const ONE_DAY = BN.from(86400);
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

  it("Should init addresses...", async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    addr1Address = await addr1.getAddress();
    addr2Address = await addr2.getAddress();
  })

  it("Should deploy pendle item contract...", async function () {
    PendleItemFactory = await ethers.getContractFactory(pendleItemFactoryContractName);
    pendleItemFactoryContract = await PendleItemFactory.deploy();
    await pendleItemFactoryContract.deployed();

    // expect factory to create 100 NFTs
    // owner should have 100 NFTs
    expect((await pendleItemFactoryContract["balanceOf(address)"](ownerAddress)).toNumber()).to.equal(100)
  }).timeout(10000)

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
    // add 5 seconds to startTime so startTime > block.timestamp
    // in unix (second time)
    const startTime = Math.floor((new Date()).getTime() / 1000) + 10

    // epoch duration (in second)
    const epochDuration = 1
    const vestingEpoch = 5

    PendleLiquidityMining = await ethers.getContractFactory(pendleLiquidityContractName);
    pendleLiquidityMiningContract = await PendleLiquidityMining.deploy(
      ownerAddress, // _governanceManager
      ownerAddress, // _pausingManager
      zeroAddress, // _whitelist
      pendleContract.address, // _pendleTokenAddress
      pendleContract.address, // _stakeToken
      zeroAddress, // _yieldToken
      startTime, // _startTime (now + 60 seconds)
      epochDuration, // _epochDuration (1 minute)
      vestingEpoch, // _vestingEpochs
      pendleItemFactoryContract.address, // item factory address
      0, // NFT - point exchange rate
      100 // pendle item points to be distributed per epoch
    );
    await pendleLiquidityMiningContract.deployed();
  }).timeout(10000);

  it("should approve liquidity mining...", async function () {
    // allow liquidity mining contract to spend 80 million pendle tokens
    await pendleContract.connect(owner)["approve(address,uint256)"](pendleLiquidityMiningContract.address, ethers.utils.parseEther("80000000"))

    // define reward for staking
    const reward = ethers.utils.parseEther("1000")

    // fund new epochs
    const rewards = Array(100).fill(reward)
    await pendleLiquidityMiningContract.connect(owner).fund(rewards)
  }).timeout(10000);

  it("should approve pendle liquidity mining to transfer NFTs from owner...", async function() {
    // approve pendle liquidity mining to transfer NFTs
    await pendleItemFactoryContract.connect(owner)["approveForAll(address)"](pendleLiquidityMiningContract.address)

    // expect pendle liquidity mining to be approved to transfer NFT with id 80
    expect((await pendleItemFactoryContract["getApproved(uint256)"](80))).to.equal(pendleLiquidityMiningContract.address)
  })

  it("should send nft to addr1...", async function () {
    // exchange points with nft
    await pendleLiquidityMiningContract.connect(addr2)["exchangePointForNFT()"]()
    await pendleLiquidityMiningContract.connect(addr2)["exchangePointForNFT()"]()

    // because exchange rate is 0, we can transfer nft to addr2 with 0 point
    expect(await pendleItemFactoryContract["balanceOf(address)"](addr2Address)).to.equal(2)

    // check if the owner of nft id 0 is add2
    expect(await pendleItemFactoryContract["ownerOf(uint256)"](0)).to.equal(addr2Address)

    // check if the rest of nft belong to owner
    expect(await pendleItemFactoryContract["ownerOf(uint256)"](2)).to.equal(ownerAddress)

    // expect addr2 to have 2 items
    expect((await pendleItemFactoryContract.connect(addr2)["getOwnedItems()"]()).length).to.equal(2)
  });
});