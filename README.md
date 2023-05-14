# AirDrop

## Usage
### Prerequisites
Install hardhat locally in the project folder:
```
npm install --save-dev hardhat
```

### Deploy AirDrop
1. Fill up environment with networks keys you are going to use:
- `GNOSIS_PRIVATE_KEY` - The private key of the account that will be used to deploy your smart contract on the Gnosis
  Chain. 
- `GNOSISSCAN_API_KEY` - The API key for the gnosisscan service that will be used for contract verification. 
- `TOKEN_ADDRESS` - The address of the token that will be distributed via the AirDrop smart contract that you are going
  to deploy.
- [Optionally] `OWNER_ADDRESS` - The address to transfer the deployed contract ownership to. If not specified, the 
  contract will remain under the control of the deploying address.
2. Run command:
   ```
   npm run deploy %network%
   ```
   where `%network%` is name of the network you would deploy your AirDrop contract to.
   Can be either `gnosis` or `localhost`.
### Upgrade AirDrop
1. Fill up **AIRDROP_ADDRESS** environment variable with address of deployed AirDrop proxy.  
2. Run command:
   ```
   npm run upgrade %network%
   ```
   where `%network%` is name of the network where you would upgrade your AirDrop contract.
   Can be either `gnosis` or `localhost`.
