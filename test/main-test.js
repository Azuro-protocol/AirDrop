const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const web3 = require("web3");

const { tokens } = require("../utils/utils");

const prepareStand = async (ethers, owner) => {
  const Usdt = await ethers.getContractFactory("TestERC20");
  const usdt = await Usdt.deploy();
  await usdt.deployed();
  await usdt.mint(owner.address, tokens(10 ** 12));

  const AirDrop = await ethers.getContractFactory("AirDrop");
  const airDrop = await upgrades.deployProxy(AirDrop, [usdt.address]);
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
    [owner, user] = await ethers.getSigners();
    [airDrop, usdt] = await prepareStand(ethers, owner);
  });
  it("Should correctly reward users", async () => {
    for (let i = 0; i < 5; i++) {
      const n = Math.floor(Math.random() * 31 + 1);
      [users, rewards, leaves, totalReward, tree] = await newRelease(n);

      await release(airDrop, owner, tree.getHexRoot(), totalReward);
      for (let k = 0; k < n; k++) {
        const user = users[k];
        const reward = rewards[k];
        const balance = await usdt.balanceOf(user.address);
        await claim(airDrop, user, tree.getHexProof(leaves[k]), reward);

        await expect(claim(airDrop, user, tree.getHexProof(leaves[k]), reward)).to.be.revertedWith("AlreadyClaimed()");
        expect(await usdt.balanceOf(user.address)).to.be.equal(balance.add(reward));
      }
      [users, rewards, leaves] = await newRelease(3); // these users have no reward
      for (let k = 0; k < 3; k++) {
        const user = users[k];
        const reward = rewards[k];

        await expect(claim(airDrop, user, tree.getHexProof(leaves[k]), reward)).to.be.revertedWith("IncorrectData()");
      }
      console.log("      🌳");
    }
    expect(await usdt.balanceOf(airDrop.address)).to.be.equal(tokens(BigNumber.from(0)));
  });
  it("Should NOT release with zero amount", async () => {
    [, , , , tree] = await newRelease(16);

    await expect(release(airDrop, owner, tree.getHexRoot(), 0)).to.be.revertedWith("AmountMustNotBeZero()");
  });
  context("AirDropRuleBased test", function () {
    let airDropRuleBased;
    let rule, ruleHash;
    const dropAmount = tokens(100);

    before(async () => {
      const AirDropRuleBased = await ethers.getContractFactory("AirDropRuleBased");
      airDropRuleBased = await upgrades.deployProxy(AirDropRuleBased, [usdt.address]);
      await airDrop.deployed();

      const encoder = new TextEncoder();
      rule = encoder.encode("Test Rule");
      ruleHash = ethers.utils.solidityKeccak256(["bytes"], [rule]);
      await airDropRuleBased.setRule(rule);

      await usdt.approve(airDropRuleBased.address, tokens(10 ** 12));

      [, , , , tree] = await newRelease(1);
    });
    it("Check the rule hash set after initialization", async () => {
      expect(await airDropRuleBased.ruleHash()).to.be.equal(ruleHash);
      await airDropRuleBased.release(tree.getHexRoot(), dropAmount, ruleHash);
    });
    it("Should not release with an incorrect rule hash passed", async () => {
      const encoder = new TextEncoder();
      const wrongRrule = encoder.encode("Wrong Test Rule");

      const wrongRuleHash = ethers.utils.solidityKeccak256(["bytes"], [wrongRrule]);
      await expect(airDropRuleBased.release(tree.getHexRoot(), dropAmount, wrongRuleHash)).to.be.revertedWith(
        "WrongRuleHash"
      );
    });
    it("Set new rule", async () => {
      const encoder = new TextEncoder();
      const newRrule = encoder.encode("New Test Rule");
      await airDropRuleBased.setRule(newRrule);

      const newRuleHash = ethers.utils.solidityKeccak256(["bytes"], [newRrule]);
      expect(await airDropRuleBased.ruleHash()).to.be.equal(newRuleHash);
      await airDropRuleBased.release(tree.getHexRoot(), dropAmount, newRuleHash);
    });
    it("Only owner can set new rule", async () => {
      await expect(airDropRuleBased.connect(user).setRule(rule)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
