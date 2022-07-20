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
Impl         0x82F75a05BdfCeD28919D60F38306e26305edd983
USDT         0xC02Ed093F9eB2EAfffb5DC3AaB2276C8a80c2B39
```
### Test accounts
```
Owner        0x36c8C25FA078Fcba503ca8AAC8B9a2F44220Df6A
PrivKey      be68f37c0dfc9b2364d77df52a085ef63c990aff8df29b8ca8e7f1ddbb5d9015
```

## Gnosis main network
### Contracts
```
AirDrop      0xF7E4E73C66A0a0261E8230daD8e2E458b5bD35B7
Impl         0x3656D53A11090B00408678af46544a8F5C0cd0FB
