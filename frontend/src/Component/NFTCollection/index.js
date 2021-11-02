import { Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import './index.scss';

export default function NFTCollection(props) {
  const [NFTs, setNFTs] = useState([])

  useEffect(() => {
    props.pendleItemContract.methods.getOwnedItems().call({
      from: props.account
    })
      .then(nfts => {
        nfts = nfts.map(e => Number(e) + 1)
        setNFTs(nfts)
      })
  }, [])

  return ( props.pendleItemContract && NFTs.length ? 
    <div className="nft-collection row">
      <Typography>Your NFTs Collection</Typography>
      <div className="collection">
        {
          NFTs.map((e) => {
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