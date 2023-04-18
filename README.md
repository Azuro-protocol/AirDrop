# AirDrop

## Documentation

- [Developer](./docs/index.html)  

## Usage
### Prerequisites
1. Install hardhat locally in the project folder:
   ```
   npm install --save-dev hardhat
   ```
### Compile

```
npm run compile
```

### Test

```
npm run test
```

### Deploy contract
1. Fill up environment with networks keys you are going to use:
   - **GNOSIS_PRIVATE_KEY**
   - **ETHERSCAN_API_KEY** (for contract verification)
2. Run command:
   ```
   npm run deploy %network%
   ```
   where **%network%** is name of network you would deploy your contract to.
### Upgrade contract
1. Fill up **AIRDROP_ADDRESS** environment key with address of deployed AirDrop proxy.  
2. Run command:
   ```
   npm run upgrade %network%
   ```
   where **%network%** is name of network where you would like to upgrade your contract.
