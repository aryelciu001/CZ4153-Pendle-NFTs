import React, { useState } from 'react';
import { Typography, Button } from '@mui/material';
import DialogComponent from '../DialogComponent';
import './index.scss'

export default function StakeInfo (props) {

  const [dialogState, setdialogState] = useState({
    open: false,
    title: "",
    text: ""
  })

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

  const claimReward = () => {
    if (props.epoch === "0") {
      setdialogState({
        open: true,
        title: "Epoch has not started!",
        text: "Wait until epoch starts"
      })
      return
    }
    props.pendleLQContract.methods.updateAndReadEpochData(props.epoch, props.account).send({
      from: props.account,
      gasPrice: "124000000000",
      gas: "10000000"
    })
      .then(() => {
        setdialogState({
          open: true,
          title: "Rewards Claimed!",
          text: "You can see your available rewards now. Wait and refresh to see it."
        })
        props.updateBalance()
      })
  }

  const redeemStakingReward = () => {
    if (props.epoch === "0") {
      setdialogState({
        open: true,
        title: "Epoch has not started!",
        text: "Wait until epoch starts"
      })
      return
    }
    props.pendleLQContract.methods.redeemRewards(props.account).send({
      from: props.account,
      gasPrice: "124000000000",
      gas: "10000000"
    })
      .then(() => {
        setdialogState({
          open: true,
          title: "Rewards Claimed!",
          text: "You can see your staking rewards now. Wait and refresh to see it."
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
      <Typography>Current Epoch: {props.epoch}</Typography>
      <Typography>Staked: { props.pendleStaked } Pendle</Typography>
      <Typography>Pendle Item Points: { props.pendleItemPoints } points</Typography>
      <Typography>Pendle Item Exchange Rate: { props.nftER } points/NFT</Typography>
      <Button onClick={claimReward} variant="contained">
        Claim Rewards
      </Button>
      <Button onClick={redeemPoints} variant="contained">
        Redeem Item Points
      </Button>
      <Button onClick={redeemStakingReward} variant="contained">
        Redeem Staking Reward
      </Button>
    </div>
  )
}