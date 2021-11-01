import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { ethers } from 'ethers';
import './index.scss'

export default function StakeInfo (props) {
  const [epoch, setepoch] = useState(0)
  const [pendleStaked, setpendleStaked] = useState(0)

  useEffect(() => {
    const pendleLQContract = props.pendleLQContract
    setInterval(() => {
      pendleLQContract.methods.getCurrentEpoch().call()
        .then(currentEpoch => {
          setepoch(currentEpoch)
        })
        .catch(e => console.log(e))
    }, 1000)
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

  return (
    <div className="stake-info row">
      <Typography>Current Epoch: {epoch}</Typography>
      <Typography>Staked: { pendleStaked } Pendle</Typography>
      <Typography>Unclaimed Reward: 0 Pendle</Typography>
    </div>
  )
}