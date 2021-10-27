import React, { useState } from 'react';

export default function Transfer(props) {
  const [amount, setamount] = useState(0)
  const [address, setaddress] = useState("")

  const send = () => {
    props.pendleContract.methods.transfer(address, props.web3.utils.toWei(String(amount), 'ether')).send({
      from: props.account
    }).then(data => console.log(data))
    .catch(e => console.log(e))
  }

  return (
    <div>
      <input placeholder="pendle amount" type="number" value={amount} onChange={e=>setamount(e.target.value)}></input>
      <input placeholder="address" type="text" value={address} onChange={e=>setaddress(e.target.value)}></input>
      <button onClick={()=>send()}>Send</button>
    </div>
  )
}