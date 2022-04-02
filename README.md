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

## Rinkeby test network
### Contracts
```
AirDrop      0x7cb621cE38BBebFB2CC3f47F1cc45ce707F72e8e
Impl         0x38D038e52bFe319CC2F56d83366E4e41e3AB72F0
USDT         0xD741469Ca14b18B4A996679E4863783BAF7288C9
```
### Test accounts
```
Owner        0x5089e2dfad395c517dbce76af3f2491eab40174f
PrivKey      2dd407af9978a25e03a3459591a0f942a0b979935dc96326b25ea1682e56ec6f

Wallet1      0x20293b57ce29340C34e65324919F83782Fb69c6a
PrivKey1     d9609229d953280f3fb071c7ac99597769b231618e74f5c6b5ce538a29b23aff

Wallet2      0xE7Cd5b8E0Ea1E4136BE09DA14b94a9C3b8454E5F
PrivKey2     7f1e0261cf7f60575e57f391a731c6447c71d34823e19a65e2c09a360aa3de13

Wallet3      0x3cbd62EE6De8302F41fCFfF5852F35715265BaEF
PrivKey3     b928bb5e371e10b77f4fb81a515cb6a5b6fb7881d3f96caa585bda7428921efd
```