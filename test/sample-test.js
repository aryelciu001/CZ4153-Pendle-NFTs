const { expect } = require("chai");
const { ethers } = require("hardhat");

const contractName = "PendleItemFactory"

describe("PendleItemFactory", async function () {
  let owner, addr1, addr2
  let PendleItemFactory
  let pif
  
  it("Deploying smart contract...", async function () {
    PendleItemFactory = await ethers.getContractFactory(contractName);
    pif = await PendleItemFactory.deploy();
    [owner, addr1, addr2] = await ethers.getSigners();
    await pif.deployed();
  })
  
  it("Create new items...", async function () {
    await pif.createNewItem("first")
    await pif.createNewItem("second")
    await pif.createNewItem("third")
  })
  
  it("Transfer items...", async function () {
    // transfer directly from owner to addr1
    await pif["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1)
    // approve addr1 to move token 2
    await pif["approve(address,uint256)"](addr1.address, 2)
    // transfer from owner to addr2, called by addr1
    await pif.connect(addr1)["safeTransferFrom(address,address,uint256)"](owner.address, addr2.address, 2)
  })

  it("Check Owner...", async function () {
    expect(await pif.ownerOf(0)).to.equal(owner.address)
    expect(await pif.ownerOf(1)).to.equal(addr1.address)
    expect(await pif.ownerOf(2)).to.equal(addr2.address)
  })
});
