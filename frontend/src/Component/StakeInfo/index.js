import React, { useEffect, useState } from 'react';
import { Typography, Button } from '@mui/material';
import { ethers } from 'ethers';
import DialogComponent from '../DialogComponent';
import './index.scss'

export default function StakeInfo (props) {
  const [epoch, setepoch] = useState(0)
  const [pendleStaked, setpendleStaked] = useState(0)
  const [dialogState, setdialogState] = useState({
    open: false,
    title: "",
    text: ""
  })

  useEffect(() => {
    const pendleLQContract = props.pendleLQContract
    const checkEpochInterval = setInterval(() => {
      pendleLQContract.methods.getCurrentEpoch().call()
        .then(currentEpoch => {
          setepoch(currentEpoch)
        })
        .catch(e => console.log(e))
    }, 1000)

    // cleanup
    return () => {
      clearInterval(checkEpochInterval)
    }
  }, [])

  useEffect(() => {
    const userAddress = props.account
    const pendleLQContract = props.pendleLQContract

    // Update epoch data
    pendleLQContract.methods.updateAndReadEpochData(epoch, userAddress).call()
      .then(() => {
        // get updated epoch data
        pendleLQContract.methods.readEpochData(epoch, userAddress).call()
          .then(data => {
            // Object.keys(data).map(d => console.log(d + " " + ethers.utils.formatEther(data[d])))
          })
          .catch(e => console.log(e))
      })
      .catch(e => console.log(e))
  }, [epoch])

  const redeemPoints = () => {
    if (props.nftER > props.pendleItemPoints) {
      setdialogState({
        open: true,
        title: "Insufficient points",
        text: "You don't have enough points to redeem NFT!"
      })
      return
    }
    props.pendleLQContract.methods.exchangePointForNFT().send({
      from: props.account,
      gasPrice: "124000000000",
      gas: "10000000"
    })
      .then(() => {
        setdialogState({
          open: true,
          title: "NFT Redeemed!",
          text: "You can see your NFTs in your collection now"
        })
        props.updateBalance()
      })
  }

  return (
    <div className="stake-info row">
      <DialogComponent
        title={dialogState.title}
        text={dialogState.text}
        handleClose={()=>setdialogState({...dialogState, open: false})}
        open={dialogState.open}
      />
      <Typography>Current Epoch: {epoch}</Typography>
      <Typography>Staked: { props.pendleStaked } Pendle</Typography>
      <Typography>Pendle Item Points: { props.pendleItemPoints } points</Typography>
      <Typography>Pendle Item Exchange Rate: { props.nftER } points/NFT</Typography>
      <Button onClick={redeemPoints} variant="contained">
        Redeem Points
      </Button>
    </div>
  )
}