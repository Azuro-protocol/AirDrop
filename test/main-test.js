const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const web3 = require("web3");

const { tokens } = require("../utils/utils");

const prepareStand = async (ethers, owner) => {
  Usdt = await ethers.getContractFactory("TestERC20");
  usdt = await Usdt.deploy();
  await usdt.deployed();
  await usdt.mint(owner.address, tokens(10 ** 12));

  AirDrop = await ethers.getContractFactory("AirDrop");
  airDrop = await upgrades.deployProxy(AirDrop, [usdt.address]);
  await airDrop.deployed();

  await usdt.approve(airDrop.address, tokens(10 ** 12));

  return [airDrop, usdt];
};

const release = async (airDrop, owner, merkleRoot, amount) => {
  return await airDrop.connect(owner).release(merkleRoot, amount, []);
};

const claim = async (airDrop, user, merkleProof, amount) => {
  return await airDrop.connect(user).claim(merkleProof, amount);
};

const newRelease = async (n) => {
  let users = [],
    rewards = [],
    leaves = [],
    totalReward = BigNumber.from(0);
  let donor, user, reward;

  [donor] = await ethers.getSigners();
  for (let k = 0; k < n; k++) {
    user = await ethers.Wallet.createRandom();
    user = user.connect(ethers.provider);
    await donor.sendTransaction({ to: user.address, value: ethers.utils.parseEther("1") });
    reward = ethers.BigNumber.from(ethers.utils.randomBytes(4));

    users.push(user);
    rewards.push(reward);
    leaves.push(toHash(user.address, reward));
    totalReward = totalReward.add(reward);
  }

  return [users, rewards, leaves, totalReward, new MerkleTree(leaves, web3.utils.keccak256, { sort: true })];
};

function toHash(address, amount) {
  return web3.utils.keccak256(web3.utils.encodePacked({ t: "address", v: address }, { t: "uint256", v: amount }));
}

describe("AirDrop test", function () {
  let owner;
  let airDrop, usdt;
  let users, rewards, totalReward, leaves, tree;

  before(async () => {
    [owner] = await ethers.getSigners();
    [airDrop, usdt] = await prepareStand(ethers, owner);
  });
  it("Should correctly reward users", async () => {
    let n, k;
    let user, reward, balance;

    for (let i = 0; i < 5; i++) {
      n = Math.floor(Math.random() * 31 + 1);
      [users, rewards, leaves, totalReward, tree] = await newRelease(n);

      await release(airDrop, owner, tree.getHexRoot(), totalReward);
      for (k = 0; k < n; k++) {
        user = users[k];
        reward = rewards[k];
        balance = await usdt.balanceOf(user.address);
        await claim(airDrop, user, tree.getHexProof(leaves[k]), reward);

        await expect(claim(airDrop, user, tree.getHexProof(leaves[k]), reward)).to.be.revertedWith("AlreadyClaimed()");
        expect(await usdt.balanceOf(user.address)).to.be.equal(balance.add(reward));
      }
      [users, rewards, leaves] = await newRelease(3); // these users have no reward
      for (k = 0; k < 3; k++) {
        user = users[k];
        reward = rewards[k];
        balance = usdt.balanceOf(user.address);

        await expect(claim(airDrop, user, tree.getHexProof(leaves[k]), reward)).to.be.revertedWith("IncorrectData()");
      }
      console.log("      🌳");
    }
    expect(await usdt.balanceOf(airDrop.address)).to.be.equal(tokens(BigNumber.from(0)));
  });
  it("Should NOT release with zero amount", async () => {
    [_, _, _, _, tree] = await newRelease(16);

    await expect(release(airDrop, owner, tree.getHexRoot(), 0)).to.be.revertedWith("AmountMustNotBeZero()");
  });
});
