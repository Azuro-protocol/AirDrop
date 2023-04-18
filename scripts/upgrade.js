const { ethers } = require("hardhat");
const hre = require("hardhat");

const { timeout } = require("../utils/utils");

async function main() {
  const [deployer] = await ethers.getSigners();
  const AirDropAddress = process.env.AIRDROP_ADDRESS;

  console.log("Deployer wallet:", deployer.address);

  // AirDrop
  const AirDrop = await ethers.getContractFactory("AirDrop");
  const upgraded = await upgrades.upgradeProxy(AirDropAddress, AirDrop);
  console.log("AirDrop proxy upgraded at:", upgraded.address);
  await timeout();

  const AirDropImpl = await upgrades.erc1967.getImplementationAddress(AirDropAddress);
  console.log("New AirDrop implementation deployed at:", AirDropImpl);
  await timeout();

  // Verify
  const chainId = await hre.network.provider.send("eth_chainId");
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
