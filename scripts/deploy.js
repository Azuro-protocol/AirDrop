const { ethers } = require("hardhat");
const hre = require("hardhat");

const { getBlockTime, tokens, timeout } = require("../utils/utils");

let TEST_WALLET = [];
TEST_WALLET.push(process.env.TEST_WALLET1);
TEST_WALLET.push(process.env.TEST_WALLET2);
TEST_WALLET.push(process.env.TEST_WALLET3);

async function main() {
  const [deployer] = await ethers.getSigners();

  let usdt, airDrop, airDropImpl;

  console.log("Deployer wallet: ", deployer.address);
  console.log("Deployer balance:", (await deployer.getBalance()).toString());
  console.log();

  const chainId = await hre.network.provider.send("eth_chainId");
  // hardhat => 800
  // kovan => 8000
  // rinkeby => 20000
  // sokol => 5000 (0x4D)
  const TIME_OUT = chainId == 0x7a69 ? 800 : chainId == 0x2a ? 8000 : chainId == 0x4d ? 5000 : 20000;

  // USDT
  {
    const Usdt = await ethers.getContractFactory("TestERC20");
    usdt = await Usdt.deploy();
    await usdt.deployed();
    await timeout(TIME_OUT);
    console.log("USDT deployed to:", usdt.address);
    await usdt.mint(deployer.address, tokens(10e9));
    await timeout(TIME_OUT);
  }

  // AirDrop
  {
    const AirDrop = await ethers.getContractFactory("AirDrop");
    airDrop = await upgrades.deployProxy(AirDrop, [usdt.address]);
    console.log("AirDrop proxy deployed to:", airDrop.address);
    await timeout(TIME_OUT);
    await airDrop.deployed();
    await timeout(TIME_OUT);
    airDropImpl = await upgrades.erc1967.getImplementationAddress(airDrop.address);
    console.log("AirDrop deployed to:", airDropImpl);
    console.log();
  }

  // settings
  {
    const approveAmount = tokens(10e9);
    await usdt.approve(airDrop.address, approveAmount);
    await timeout(TIME_OUT);
    console.log("Approve done", approveAmount.toString());
    console.log();

    time = await getBlockTime(ethers);

    for (const iterator of Array(3).keys()) {
      await usdt.transfer(TEST_WALLET[iterator], tokens(10e7));
      await timeout(TIME_OUT);
      console.log("10 000 000 USDT sent to %s", TEST_WALLET[iterator]);
    }
    console.log();
  }

  // verification
  if (chainId != 0x7a69) {
    await hre.run("verify:verify", {
      address: airDropImpl,
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
