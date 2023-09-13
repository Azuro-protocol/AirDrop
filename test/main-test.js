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

const claim = async (airDrop, user, releaseId, merkleProof, amount) => {
  return await airDrop.connect(user).claim(releaseId, merkleProof, amount);
};

const newRelease = async (releaseId, users) => {
  let rewards = [],
    leaves = [],
    totalReward = BigNumber.from(0);

  for (let k = 0; k < users.length; k++) {
    const reward = ethers.BigNumber.from(ethers.utils.randomBytes(4));
    rewards.push(reward);
    leaves.push(toHash(releaseId, users[k].address, reward));
    totalReward = totalReward.add(reward);
  }

  return [rewards, leaves, totalReward, new MerkleTree(leaves, web3.utils.keccak256, { sort: true })];
};

function toHash(releaseId, address, amount) {
  return web3.utils.keccak256(
    web3.utils.encodePacked({ t: "uint256", v: releaseId }, { t: "address", v: address }, { t: "uint256", v: amount })
  );
}

describe("AirDrop test", function () {
  let owner;
  let airDrop, usdt;
  let users, rewards, totalReward, leaves, tree;
  let releaseId = 0;

  before(async () => {
    users = await ethers.getSigners();
    [owner, user] = await ethers.getSigners();
    [airDrop, usdt] = await prepareStand(ethers, owner);
  });
  it("Should correctly reward users", async () => {
    for (let i = 0; i < 5; i++) {
      [rewards, leaves, totalReward, tree] = await newRelease(++releaseId, users);

      await release(airDrop, owner, tree.getHexRoot(), totalReward);
      for (let k = 0; k < users.length; k++) {
        const user = users[k];
        const reward = rewards[k];
        const balance = await usdt.balanceOf(user.address);
        await claim(airDrop, user, releaseId, tree.getHexProof(leaves[k]), reward);

        await expect(claim(airDrop, user, releaseId, tree.getHexProof(leaves[k]), reward)).to.be.revertedWith(
          "AlreadyClaimed()"
        );
        expect(await usdt.balanceOf(user.address)).to.be.equal(balance.add(reward));
      }
      console.log("      🌳");
    }
    expect(await usdt.balanceOf(airDrop.address)).to.be.equal(tokens(BigNumber.from(0)));
  });
  it("Should reward users after new release", async () => {
    [rewards, leaves, totalReward, tree] = await newRelease(++releaseId, users);
    await release(airDrop, owner, tree.getHexRoot(), totalReward);

    [rewards2, leaves2, totalReward2, tree2] = await newRelease(++releaseId, users);
    await release(airDrop, owner, tree2.getHexRoot(), totalReward2);

    for (let k = 0; k < users.length; k++) {
      const user = users[k];
      const reward = rewards[k];
      const reward2 = rewards2[k];
      const balance = await usdt.balanceOf(user.address);

      await claim(airDrop, user, releaseId - 1, tree.getHexProof(leaves[k]), reward);
      await claim(airDrop, user, releaseId, tree2.getHexProof(leaves2[k]), reward2);

      expect(await usdt.balanceOf(user.address)).to.be.equal(balance.add(reward).add(reward2));
    }
  });
  it("Should NOT reward for unexciting release", async () => {
    [rewards, leaves, totalReward, tree] = await newRelease(++releaseId, users);
    await release(airDrop, owner, tree.getHexRoot(), totalReward);
    await expect(claim(airDrop, users[0], releaseId + 1, tree.getHexProof(leaves[0]), rewards[0])).to.be.revertedWith(
      "ReleaseDoesNotExist"
    );
  });
  it("Should NOT reward with incorrect data", async () => {
    [rewards, leaves, totalReward, tree] = await newRelease(++releaseId, users);
    await release(airDrop, owner, tree.getHexRoot(), totalReward);
    await expect(claim(airDrop, users[0], releaseId, tree.getHexProof(leaves[1]), rewards[0])).to.be.revertedWith(
      "IncorrectData"
    );
    await expect(claim(airDrop, users[0], releaseId, tree.getHexProof(leaves[0]), rewards[1])).to.be.revertedWith(
      "IncorrectData"
    );
    await expect(claim(airDrop, users[1], releaseId, tree.getHexProof(leaves[0]), rewards[0])).to.be.revertedWith(
      "IncorrectData"
    );
  });
  it("Should NOT release with zero amount", async () => {
    [, , , tree] = await newRelease(++releaseId, users);

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

      [, , , tree] = await newRelease(++releaseId, users);
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
