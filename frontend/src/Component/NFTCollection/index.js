import { Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import './index.scss';

export default function NFTCollection(props) {
  return ( props.pendleItemContract && props.NFTs.length ? 
    <div className="nft-collection row">
      <Typography>Your NFTs Collection</Typography>
      <div className="collection">
        {
          props.NFTs.map((e) => {
            return (
              <div 
                className="image-container" 
                style={{
                  backgroundImage: `url('/nfts/pendle${e > 3 ? e % 3 : e}.jpg')`,
                  backgroundPosition: "center",
                  backgroundSize: "cover"
                }}
                key={e}
              >
                <Typography>Pendle{e}</Typography>
              </div>
            )
          })
        }
      </div>
    </div>
    :
    null
  )
}