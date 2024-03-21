require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-contract-sizer");
require("hardhat-docgen");
require("hardhat-gas-reporter");
require("web3");

require("dotenv").config();

const GNOSIS_PRIVATE_KEY = process.env.GNOSIS_PRIVATE_KEY || "";
const GNOSISSCAN_API_KEY = process.env.GNOSISSCAN_API_KEY || "";

const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const exportNetworks = {
  hardhat: {
    accounts: {
      accountsBalance: "1000000000000000000000000000000000",
    },
  },
};

if (GNOSIS_PRIVATE_KEY != "") {
  exportNetworks["gnosis"] = {
    url: `https://rpc.gnosischain.com/`,
    accounts: [`${GNOSIS_PRIVATE_KEY}`],
  }
}
if (POLYGON_PRIVATE_KEY != "") {
  exportNetworks["polygon"] = {
    url: "https://polygon-bor-rpc.publicnode.com",
    accounts: [`${POLYGON_PRIVATE_KEY}`],
  };
}

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100000,
          },
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: exportNetworks,
  etherscan: {
    apiKey: {
      gnosis: GNOSISSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: true,
  },
};
