import React, { useEffect, useState } from 'react'
import Transfer from './Component/Transfer'
import Web3 from 'web3'
import ERC20ABI from './ABI/ERC20.json'
const PendleAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

export default function App () {
  const [web3, setweb3] = useState(null)
  const [account, setaccount] = useState(null)
  const [pendleContract, setpendleContract] = useState(null)
  const [etherBalance, setetherBalance] = useState(0)
  const [pendleBalance, setpendleBalance] = useState(0)

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
    setpendleContract(new web3.eth.Contract(ERC20ABI, PendleAddress))

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
    if (!account) return
    web3.eth.getBalance(account)
      .then(etherBalance => web3.utils.fromWei(etherBalance))
      .then(etherBalance => setetherBalance(etherBalance))

    if (!pendleContract) return
    pendleContract.methods.balanceOf(account).call()
      .then(pendleBalance => web3.utils.fromWei(pendleBalance))
      .then(pendleBalance => setpendleBalance(pendleBalance))
  }, [account, web3, pendleContract]) 

  return (
    <div className="app">
      <div>Connected Address: { account }</div>
      <div>Ether Balance: { etherBalance }</div>
      <div>Pendle Balance: { pendleBalance }</div>
      {
        web3 && pendleContract && account 
        ? 
        <Transfer 
          web3={web3} 
          pendleContract={pendleContract} 
          account={account}
        />
        :
        null
      }
    </div>
  )  
}

