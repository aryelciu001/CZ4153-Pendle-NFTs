import { Typography, TextField, Button } from '@mui/material';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import DialogComponent from '../DialogComponent';
import './index.scss'

export default function StakeInput(props) {
  const [pendleToStake, setpendleToStake] = useState("")
  const [dialogState, setdialogState] = useState({
    open: false,
    title: "hello",
    text: "world"
  })

  const stake = (e) => {
    e.preventDefault()
    if (pendleToStake <= 0) return
    if (props.epoch <= 0) {
      setdialogState({
        open: true,
        title: "Can't stake now",
        text: "Epoch has not started."
      })
      return
    }
    if (props.pendleBalance < Number(pendleToStake)) {
      setdialogState({
        open: true,
        title: "Insufficient Balance",
        text: "Your pendle token amount is not enough for the transaction."
      })
      return
    }
    const pendleContract = props.pendleContract
    const pendleLQContract = props.pendleLQContract
    console.log(pendleLQContract._address, props.account)
    pendleContract.methods.approve(pendleLQContract._address, ethers.utils.parseEther(pendleToStake)).send({
      from: props.account,
      gasPrice: "124000000000",
      gas: "10000000"
    })
      .then(() => {
        pendleLQContract.methods.stake(props.account, ethers.utils.parseEther(pendleToStake)).send({
          from: props.account,
          gasPrice: "124000000000",
          gas: "10000000"
        })
          .then(() => {
            setdialogState({
              open: true,
              title: "Transaction successful!",
              text: `${pendleToStake} pendles have been staked.`
            })
            setpendleToStake("")
            props.updateBalance()
          })
          .catch(e => {
            if (e.message.includes("TRANSFER_EXCEED_BALANCE")) {
              setdialogState({
                open: true,
                title: "Insufficient Balance",
                text: "Your pendle token amount is not enough for the transaction."
              })
            }
            else {
              setdialogState({
                open: true,
                title: "Something wrong",
                text: "Your transaction cannot be processed."
              })
            }
          })
      })
      .catch(() => {})
  }

  return (
    <div className="stake-input row">
      <DialogComponent
        title={dialogState.title}
        text={dialogState.text}
        handleClose={()=>setdialogState({...dialogState, open: false})}
        open={dialogState.open}
      />
      {
        props.show
        ?
        <>
          <Typography>Stake your pendle tokens and earn NFTs!</Typography>
          <TextField 
            value={pendleToStake} 
            onChange={e => setpendleToStake(e.target.value)} 
            className="stake-input-input" 
            id="pendle-to-stake" 
            label="Pendle amount to stake" 
            variant="outlined" 
            type="number"
          />
          <Button onClick={stake} variant="contained">
            Stake
          </Button>
        </>
        :
        <Typography>Connect your metamask</Typography>
      }
    </div>
  )
}