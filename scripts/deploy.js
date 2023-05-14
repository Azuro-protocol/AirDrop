const { ethers } = require("hardhat");
const hre = require("hardhat");
const { timeout } = require("../utils/utils");

const owner = process.env.OWNER_ADDRESS;
const tokenAddress = process.env.TOKEN_ADDRESS;

async function main() {
  const [deployer] = await ethers.getSigners();
  let airDrop, airDropImpl;

  console.log("Deployer address: ", deployer.address);

  // AirDrop
  const AirDrop = await ethers.getContractFactory("AirDrop");
  airDrop = await upgrades.deployProxy(AirDrop, [tokenAddress]);
  await timeout();
  await airDrop.deployed();
  console.log("AirDrop proxy deployed at:", airDrop.address);

  const airDropImplAddress = await upgrades.erc1967.getImplementationAddress(airDrop.address);
  airDropImpl = await AirDrop.attach(airDropImplAddress);
  await timeout();
  console.log("AirDrop implementation deployed at:", airDropImplAddress);

  // Initial settings
  if (owner) {
    await upgrades.admin.transferProxyAdminOwnership(owner);
    await airDropImpl.transferOwnership(owner);
    await timeout();
    console.log("AirDrop owner address set to:", owner);
  }

  // Verification
  const chainId = await hre.network.provider.send("eth_chainId");
  if (chainId != 0x7a69) {
    await hre.run("verify:verify", {
      address: airDropImpl.address,
      constructorArguments: [],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
