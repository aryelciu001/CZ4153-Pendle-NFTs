import React from 'react';
import { Chip } from '@mui/material';
import './index.scss';

export default function UserAccount (props) {
  return (
    <div className="user-account">
      <Chip label={ props.account ? props.account : "Your address" } />
      <Chip label={ "Ether: " + props.etherBalance } />
      <Chip label={ "Pendle: " + props.pendleBalance } />
    </div>
  )
}