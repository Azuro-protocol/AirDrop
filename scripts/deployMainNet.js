const { ethers } = require("hardhat");
const hre = require("hardhat");
const { timeout } = require("../utils/utils");

const owner = process.env.OWNER_ADDRESS;

let wxDaiAddress;

async function main() {
  const chainId = await hre.network.provider.send("eth_chainId");
  // hardhat => 800
  // gnosis => 10000
  const TIME_OUT = chainId == 0x7a69 ? 800 : 20000;
  const [deployer] = await ethers.getSigners();

  let airDrop, airDropImpl;

  console.log("Deployer wallet: ", deployer.address);
  console.log("Deployer balance:", (await deployer.getBalance()).toString());

  // wxDAI
  {
    wxDaiAddress = process.env.WXDAI_ADDRESS;
  }

  // AirDrop
  {
    const AirDrop = await ethers.getContractFactory("AirDrop");
    airDrop = await upgrades.deployProxy(AirDrop, [wxDaiAddress]);
    await timeout(TIME_OUT);
    await airDrop.deployed();
    console.log("AirDrop proxy deployed to:", airDrop.address);

    const airDropImplAddress = await upgrades.erc1967.getImplementationAddress(airDrop.address);
    airDropImpl = await AirDrop.attach(airDropImplAddress);
    await airDropImpl.initialize(wxDaiAddress);
    await timeout(TIME_OUT);
    console.log("AirDrop implementation deployed to:", airDropImplAddress);
  }

  // Initial settings
  {
    if (owner) {
      // transfer ownership
      await upgrades.admin.transferProxyAdminOwnership(owner);
      await airDropImpl.transferOwnership(owner);
      await timeout(TIME_OUT);
      console.log("AirDrop owner address set to:", owner);
    }
  }

  // Verification
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
