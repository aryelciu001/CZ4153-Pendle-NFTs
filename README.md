# How to run the app on your own

## 0. Install dependencies
  - run `npm install` at:
    - `./` for hardhat
    - `./frontend` for web3-app
## 1. Start your own node (using hardhat)
  - `npm run node`
## 2. Deploy contracts (using hardhat)
  - `npm run deploy`
  - it will compile contracts
  - it will create artifacts (located at `./frontend/src` so it is easily accessed by frontend)
## 3. Run web3-app (using react)
  - `npm run frontend`
# How to run test script
  - test script is located at `./test/sample-test.ts`
  - run `npx hardhat test`