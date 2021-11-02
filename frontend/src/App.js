import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import Web3 from 'web3'
import PendleAbi from  './artifacts/contracts/pendle/tokens/PENDLE.sol/PENDLE.json'
import PendleLQABI from './artifacts/contracts/pendle/core/abstractV2/PendleLiquidityMiningBaseV2.sol/PendleLiquidityMiningBaseV2.json'
import PendleItemABI from './artifacts/contracts/PendleItemFactory.sol/PendleItemFactory.json'
import UserAccount from './Component/UserAccount/index.js'
import StakeInput from './Component/StakeInput/index.js'
import StakeInfo from './Component/StakeInfo/index.js'
import NFTCollection from './Component/NFTCollection'
const PendleAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"
const PendleItemAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"
const PendleLQAddress = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"

export default function App () {
  const [web3, setweb3] = useState(null)
  const [account, setaccount] = useState(null)
  const [pendleContract, setpendleContract] = useState(null)
  const [pendleLQContract, setpendleLQContract] = useState(null)
  const [pendleItemContract, setpendleItemContract] = useState(null)
  const [etherBalance, setetherBalance] = useState(0)
  const [pendleBalance, setpendleBalance] = useState(0)
  const [pendleStaked, setpendleStaked] = useState(0)
  const [pendleItemPoints, setpendleItemPoints] = useState(0)
  const [nftER, setnftER] = useState(0)
  const [epoch, setepoch] = useState(0)
  const [NFTs, setNFTs] = useState([])

  // First initialization
  // setup metamask
  useEffect(() => {
    const init = async () => {
      // setup metamask
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.enable();
          // Acccounts now exposed
          await setweb3(web3)
        } catch (error) {
          console.error(error);
        }
      }
    }
    init()
  }, [])

  // Get metamask account and detect account change
  useEffect(() => {
    if (!web3) return

    // setup pendle contract
    setpendleContract(new web3.eth.Contract(PendleAbi.abi, PendleAddress))
    setpendleLQContract(new web3.eth.Contract(PendleLQABI.abi, PendleLQAddress))
    setpendleItemContract(new web3.eth.Contract(PendleItemABI.abi, PendleItemAddress))

    // get account address for the first time
    web3.eth.getAccounts()
      .then(accounts => setaccount(accounts[0]))

    // check account change
    const checkAccountChange = setInterval(async () => {
      let address = await web3.eth.getAccounts()
      address = address[0]
      if (address !== account) setaccount(address)
    }, 100);

    // cleanup
    return () => {
      clearInterval(checkAccountChange)
    }
  }, [web3, account])

  // Get metamask balance
  useEffect(() => {
    updateBalance()
  }, [account, web3, pendleContract]) 

  const updateBalance = () => {
    if (!account) return
    web3.eth.getBalance(account)
      .then(etherBalance => ethers.utils.formatEther(etherBalance))
      .then(etherBalance => setetherBalance(etherBalance))

    if (!pendleContract) return
    pendleContract.methods.balanceOf(account).call()
      .then(pendleBalance => {
        return ethers.utils.formatEther(pendleBalance)
      })
      .then(pendleBalance => setpendleBalance(pendleBalance))

    if (!pendleLQContract) return
    pendleLQContract.methods.balances(account).call()
      .then(pendleStakedBlockchain => setpendleStaked(ethers.utils.formatEther(pendleStakedBlockchain)))

    pendleLQContract.methods.pendleItemPoints(account).call()
      .then(point => setpendleItemPoints(point))

    pendleLQContract.methods.pointExchangeRate().call()
      .then(exchangeRate => setnftER(exchangeRate))

    const checkEpochInterval = setInterval(() => {
      pendleLQContract.methods.getCurrentEpoch().call()
        .then(currentEpoch => {
          setepoch(currentEpoch)
        })
        .catch(e => console.log(e))
    }, 1000)

    pendleItemContract.methods.getOwnedItems().call({
      from: account
    })
      .then(nfts => {
        nfts = nfts.map(e => Number(e) + 1)
        setNFTs(nfts)
      })

    // cleanup
    return () => {
      clearInterval(checkEpochInterval)
    }
  }

  return (
    <div className="app">
      <UserAccount 
        account={account} 
        etherBalance={etherBalance} 
        pendleBalance={pendleBalance}
      />
      <StakeInput 
        show={web3 && pendleContract && pendleLQContract && account} 
        account={account} etherBalance={etherBalance} 
        pendleBalance={pendleBalance}
        pendleContract={pendleContract}
        pendleLQContract={pendleLQContract}
        updateBalance={updateBalance}
        epoch={epoch}
      />
      { 
        web3 && pendleContract && account && pendleLQContract 
        ?
        <>
          <StakeInfo 
            web3={web3}
            account={account} 
            etherBalance={etherBalance} 
            pendleBalance={pendleBalance}
            pendleLQContract={pendleLQContract}
            pendleStaked={pendleStaked}
            pendleItemPoints={pendleItemPoints}
            nftER={nftER}
            updateBalance={updateBalance}
            epoch={epoch}
          />
          <NFTCollection
            pendleItemContract={pendleItemContract}
            account={account}
            NFTs={NFTs}
          ></NFTCollection>
        </>
        :
        null
      }
    </div>
  )  
}

