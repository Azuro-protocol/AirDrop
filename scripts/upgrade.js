const { ethers } = require("hardhat");
const hre = require("hardhat");

const { timeout } = require("../utils/utils");

async function main() {
  const [deployer] = await ethers.getSigners();
  const AirDropAddr = process.env.CONTRACT_ADDRESS;
  const chainId = await hre.network.provider.send("eth_chainId");
  // hardhat => 800
  // kovan => 8000
  // rinkeby => 20000
  // sokol => 5000 (0x4D)
  const TIME_OUT = chainId == 0x7a69 ? 800 : chainId == 0x2a ? 8000 : 20000;

  console.log("Deployer wallet: ", deployer.address);
  console.log("Deployer balance:", (await deployer.getBalance()).toString());
  console.log();

  // AirDrop
  const AirDrop = await ethers.getContractFactory("AirDrop");
  const upgraded = await upgrades.upgradeProxy(AirDropAddr, AirDrop);
  console.log("AirDrop proxy upgraded at:", upgraded.address);
  await timeout(TIME_OUT);
  AirDropImpl = await upgrades.erc1967.getImplementationAddress(AirDropAddr);
  console.log("New AirDrop deployed to:  ", AirDropImpl);

  await timeout(TIME_OUT);

  // verify
  if (chainId != 0x7a69)
    await hre.run("verify:verify", {
      address: AirDropImpl,
      constructorArguments: [],
    });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
