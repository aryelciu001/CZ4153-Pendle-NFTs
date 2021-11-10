# How to run the app on your own

## 0. Install dependencies
  - run `npm install` at:
    - `./` for hardhat
    - `./frontend` for web3-app
  - import simulation address to metamask:
    - Owner/Deployer
      - Address: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
      - Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    - Addr1
      - Address: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (10000 ETH)
      - Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
    - Addr2
      - Address: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc (10000 ETH)
      - Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
  - If there is any issue when staking, try **resetting account on metamask**
  - If there is no pendle balance, wait and refresh browser for a few times

## 1. Start your own node (using hardhat)
  - `npm run node`

## 2. Deploy contracts (using hardhat)
  - `npm run deploy`
  - it will compile contracts
  - it will create artifacts (located at `./frontend/src` so it is easily accessed by frontend)

## 3. Run web3-app (using react)
  - `npm run frontend`
  - connect to metamask (select `localhost:8545` network)
  - wait for 60 seconds before staking (epoch has not started!)
  - to see NFTs, after redeeming, restart page. You will see NFT Collections below
  - Sometimes metamask keeps loading even though the transaction passes. Refresh page if it happens
  - for smoother experience, reset account on the address you want to use!

# How to run test script
  - test script is located at `./test/sample-test.ts`
  - run `npx hardhat test`

# How to interact with contracts using console
  - run `npm run console`

# Software Requirements

## Supporting ERC-721 enumerable NFTs as rewards + pendle tokens. The reward mechanism of PENDLE tokens should remain unchanged (linearly vested over epochs)
## A method to track the reward points proportional to the amount of LP tokens provided by the user to represent when he is eligible to claim an NFT.
## A configurable exchange rate of rewards points to an NFT.
## Reward points can only be accumulated when LPs are staked.