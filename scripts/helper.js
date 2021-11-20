/**
 * 
 * List of commands for console interaction
 * Not important if you don't use console
 * 
 */

// npx hardhat console --network localhost
import { expect } from "chai";
import { Signer, ContractFactory, Contract, BigNumber as BN } from "ethers";
import { ethers } from "hardhat";

// init
const Pendle = await ethers.getContractFactory("PENDLE");const pendle = await Pendle.attach("0x5fbdb2315678afecb367f032d93f642f64180aa3");const PendleLiquidityMining = await ethers.getContractFactory("PendleLiquidityMiningBaseV2");const pendleLQ = await PendleLiquidityMining.attach("0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");

const [owner, addr1, addr2] = await ethers.getSigners();

// mine new block
await network.provider.send("evm_mine");
await ethers.provider.getBlock();
await ethers.provider.getBlockNumber();

await pendleLQ.getCurrentEpoch()

// ethers
ethers.utils.parseEther()
ethers.utils.formatEther()
ethers.utils.formatEther(await pendle.balanceOf("0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"))
await pendle.connect(owner).transfer(await addr2.getAddress(), ethers.utils.parseEther("500"))
await pendle.connect(owner).approve("0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", ethers.utils.parseEther("500"))
await pendle.connect(addr2).transferFrom("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", ethers.utils.parseEther("500"))
await pendle.connect(owner)["approve(address,uint256)"](await pendleLQ.address, ethers.utils.parseEther("80000000"))

// allow liquidity mining contract to spend 80 million pendle tokens
await pendle.connect(owner).approve(pendleLQ.address, ethers.utils.parseEther("80000000"));

// define reward for staking
const reward = ethers.utils.parseEther("1000")

// fund new epoch
const rewards = [reward, reward, reward]
await pendleLQ.connect(owner).fund(rewards)

// stake
await pendle.connect(addr2).approve(pendleLQ.address, ethers.utils.parseEther("10"));
await pendleLQ.connect(addr2).stake(await addr2.getAddress(), ethers.utils.parseEther("10"))

// list of usable accounts

// Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
// Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

// Account #1: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (10000 ETH)
// Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

// Account #2: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc (10000 ETH)
// Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

// Account #3: 0x90f79bf6eb2c4f870365e785982e1f101e93b906 (10000 ETH)
// Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

// Account #4: 0x15d34aaf54267db7d7c367839aaf71a00a2c6a65 (10000 ETH)
// Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

// Account #5: 0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc (10000 ETH)
// Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba

// tidy up ==============================================================================================================================================================================

// mine new block

await network.provider.send("evm_mine");
await ethers.provider.getBlock();
await ethers.provider.getBlockNumber();

// get current epoch

ethers.utils.formatEther(await pendleLQ.getCurrentEpoch())

// 1. init contracts

const Pendle = await ethers.getContractFactory("PENDLE");const pendle = await Pendle.attach("0x5fbdb2315678afecb367f032d93f642f64180aa3");const PendleItemFactory = await ethers.getContractFactory("PendleItemFactory");const pif = await PendleItemFactory.attach("0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");const PendleLiquidityMining = await ethers.getContractFactory("PendleLiquidityMiningBaseV2");const pendleLQ = await PendleLiquidityMining.attach("0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0");

// 2. get eth accounts

const [owner, addr1, addr2] = await ethers.getSigners();

// 3. approve pendleLQ to spend owner's pendles

await pendle.connect(owner).approve(pendleLQ.address, ethers.utils.parseEther("80000000"))

// 4. fund epoch for stake rewards

const reward = ethers.utils.parseEther("100");
const rewards = Array(1000).fill(reward);
await pendleLQ.connect(owner).fund(rewards);

// 5. transfer some pendles to another address to stake

await pendle.connect(owner).transfer(await addr1.getAddress(), ethers.utils.parseEther("10000"));await pendle.connect(owner).transfer(await addr2.getAddress(), ethers.utils.parseEther("10000"))

// 6. pendleLQ funded, now can stake

await pendle.connect(addr1).approve(pendleLQ.address, ethers.utils.parseEther("1000"));await pendleLQ.connect(addr1).stake(await addr1.getAddress(), ethers.utils.parseEther("1000"))

await pendle.connect(addr2).approve(pendleLQ.address, ethers.utils.parseEther("1000"));await pendleLQ.connect(addr2).stake(await addr2.getAddress(), ethers.utils.parseEther("1000"))

// 7. check stake status

ethers.utils.formatEther((await pendleLQ.connect(addr2).readEpochData(31, await addr2.getAddress())).totalStakeUnits)
await pendleLQ.connect(addr2).readEpochData(await pendleLQ.getCurrentEpoch(), await addr2.getAddress())

await pendleLQ.connect(addr1).updateAndReadEpochData(await pendleLQ.getCurrentEpoch(), await addr1.getAddress())

await pendleLQ.connect(addr2).withdraw(await addr2.getAddress(), ethers.utils.parseEther("1000"))

// mine new block every 2 second
setInterval(async ()=>{await network.provider.send("evm_mine");}, 1000*2)
await pendleLQ.getCurrentEpoch()

(await pendleLQ.pendleItemPoints(await addr1.getAddress())).toNumber()
(await pendleLQ.pendleItemPoints(await addr2.getAddress())).toNumber()

ethers.utils.formatEther((await pendleLQ.connect(addr2).readEpochData(2, await addr2.getAddress())).availableRewardsForUser)

// update current epoch
await pendleLQ.connect(addr1).updateAndReadEpochData(await pendleLQ.getCurrentEpoch(), await addr1.getAddress())

// get status of current epoch
let epochData = await pendleLQ.connect(addr1).readEpochData(await pendleLQ.getCurrentEpoch(), await addr1.getAddress());ethers.utils.formatEther(epochData.availableRewardsForUser)
ethers.utils.formatEther(await pendleLQ.totalStake())

const ownerItems = (await pif.connect(owner).getOwnedItems())
let count = 0;
for (let e of ownerItems) {console.log(e);count++;}
ownerItems.map(e => console.log(e.toNumber()))

await pendleLQ.connect(owner).setNFTExchangeRate(100)