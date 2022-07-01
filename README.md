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

### Run local node

```
npm run node
```

### Deploy contract
1. Fill up environment with networks keys you are going to use:
   - **ALCHEMY_API_KEY_RINKEBY** (for node connection)
   - **RINKEBY_PRIVATE_KEY**
   - **ETHERSCAN_API_KEY** (for contract verification)
2. Run command:
   ```
   npm run deploy %network%
   ```
   where **%network%** is name of network you would deploy your contract to.
### Upgrade contract
1. Fill up **CONTRACT_ADDRESS** environment key with address of deployed TotoBetting proxy.  
2. Run command:
   ```
   npm run upgrade %network%
   ```
   where **%network%** is name of network where you would like to upgrade your contract.

## Sokol test network
### Contracts
```
AirDrop      0x553f721982F7108A0DaC7B8b61CabEFBC9237f66
Impl         0xB70c2c171102B339AEf0BC0Dbc8B9057Ae9f14dd
USDT         0xe39F07900f5222f2d69f1bf3842Ce4f047C0aAa2
```
### Test accounts
```
Owner        0x36c8C25FA078Fcba503ca8AAC8B9a2F44220Df6A
PrivKey      be68f37c0dfc9b2364d77df52a085ef63c990aff8df29b8ca8e7f1ddbb5d9015
