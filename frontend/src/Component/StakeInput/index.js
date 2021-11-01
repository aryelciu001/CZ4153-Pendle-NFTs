import { Typography, TextField, Button } from '@mui/material';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import './index.scss'

export default function StakeInput(props) {
  const [pendleToStake, setpendleToStake] = useState("")

  const stake = (e) => {
    e.preventDefault()
    if (pendleToStake <= 0) return
    const pendleContract = props.pendleContract
    const pendleLQContract = props.pendleLQContract
    pendleContract.methods.approve(pendleLQContract._address, ethers.utils.parseEther(pendleToStake.toString())).call()
      .then(() => {
        pendleLQContract.methods.stake(props.account, ethers.utils.parseEther(pendleToStake.toString())).call()
          .then(data => console.log(data))
          .catch(e => console.log(e))
      })
      .catch(e => console.log(e))
  }

  return (
    <div className="stake-input row">
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