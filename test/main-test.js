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
  beforeEach(async () => {
    [rewards, leaves, totalReward, tree] = await newRelease(++releaseId, users);
    await usdt.connect(owner).transfer(airDrop.address, totalReward);
    await release(airDrop, owner, tree.getHexRoot(), totalReward);
  });
  it("Check owner rights", async () => {
    await expect(release(airDrop, user, tree.getHexRoot(), totalReward)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(airDrop.connect(user).withdrawReserve(totalReward)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
  it("Should correctly reward users", async () => {
    for (let i = 0; i < 5; i++) {
      [rewards, leaves, totalReward, tree] = await newRelease(++releaseId, users);

      await usdt.connect(owner).transfer(airDrop.address, totalReward);
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
        expect(await usdt.balanceOf(airDrop.address)).to.be.equal(await airDrop.lockedReserve());
      }
      console.log("      🌳");
    }
  });
  it("Should reward users after new release", async () => {
    [rewards2, leaves2, totalReward2, tree2] = await newRelease(++releaseId, users);
    await usdt.connect(owner).transfer(airDrop.address, totalReward2);
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
  it("Should reward users after new release using batching claim method", async () => {
    [rewards2, leaves2, totalReward2, tree2] = await newRelease(++releaseId, users);
    await usdt.connect(owner).transfer(airDrop.address, totalReward2);
    await release(airDrop, owner, tree2.getHexRoot(), totalReward2);

    for (let k = 0; k < users.length; k++) {
      const user = users[k];
      const reward = rewards[k];
      const reward2 = rewards2[k];
      const balance = await usdt.balanceOf(user.address);

      const claimData = [];
      claimData.push({
        releaseId: releaseId - 1,
        merkleProof: tree.getHexProof(leaves[k]),
        amount: reward,
      });
      claimData.push({
        releaseId: releaseId,
        merkleProof: tree2.getHexProof(leaves2[k]),
        amount: reward2,
      });

      await airDrop.connect(user).claimBatch(claimData);
      expect(await usdt.balanceOf(user.address)).to.be.equal(balance.add(reward).add(reward2));
    }
  });
  it("Should NOT reward for unexciting release", async () => {
    await expect(claim(airDrop, users[0], releaseId + 1, tree.getHexProof(leaves[0]), rewards[0])).to.be.revertedWith(
      "ReleaseDoesNotExist"
    );
  });
  it("Should NOT reward with incorrect data", async () => {
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
    await expect(release(airDrop, owner, tree.getHexRoot(), 0)).to.be.revertedWith("AmountMustNotBeZero()");
  });
  it("Should NOT release with insufficient contract balance", async () => {
    [rewards, leaves, totalReward, tree] = await newRelease(++releaseId, users);

    await usdt.connect(owner).transfer(airDrop.address, totalReward.sub(1));
    await expect(release(airDrop, owner, tree.getHexRoot(), totalReward)).to.be.revertedWith(
      "InsufficientContractBalance"
    );

    await usdt.connect(owner).transfer(airDrop.address, 1);
    await release(airDrop, owner, tree.getHexRoot(), totalReward);
  });
  it("Should NOT release with locked contract balance", async () => {
    [rewards, leaves, totalReward, tree] = await newRelease(++releaseId, users);
    await usdt.connect(owner).transfer(airDrop.address, totalReward);
    await release(airDrop, owner, tree.getHexRoot(), totalReward);

    [rewards2, leaves2, totalReward2, tree2] = await newRelease(++releaseId, [user]);

    await expect(release(airDrop, owner, tree2.getHexRoot(), totalReward2)).to.be.revertedWith(
      "InsufficientContractBalance"
    );
  });
  it("Should NOT withdraw reserve with insufficient contract balance", async () => {
    expect(await usdt.balanceOf(airDrop.address)).to.be.equal(await airDrop.lockedReserve());
    await expect(airDrop.connect(owner).withdrawReserve(1)).to.be.revertedWith("InsufficientContractBalance");
  });
  it("Should NOT claim reward with insufficient release balance", async () => {
    [rewards, leaves, totalReward, tree] = await newRelease(releaseId, [user]);
    await usdt.connect(owner).transfer(airDrop.address, totalReward);
    await release(airDrop, owner, tree.getHexRoot(), totalReward.sub(1));
    await expect(claim(airDrop, user, releaseId, tree.getHexProof(leaves[0]), totalReward)).to.be.revertedWith(
      "InsufficientReleaseBalance"
    );
  });
  it("Should NOT claim stopped reward", async () => {
    const user0 = users[0];
    const user1 = users[1];
    let firstRelease = releaseId;
    let secondRelease = ++releaseId;

    [rewards2, leaves2, totalReward2, tree2] = await newRelease(secondRelease, users);
    await usdt.connect(owner).transfer(airDrop.address, totalReward2);
    await release(airDrop, owner, tree2.getHexRoot(), totalReward2);

    const balance0 = await usdt.balanceOf(user0.address);

    await claim(airDrop, user0, firstRelease, tree.getHexProof(leaves[0]), rewards[0]);
    await claim(airDrop, user0, secondRelease, tree2.getHexProof(leaves2[0]), rewards2[0]);

    expect(await usdt.balanceOf(user0.address)).to.be.equal(balance0.add(rewards[0]).add(rewards2[0]));

    // stop first release
    const balance1 = await usdt.balanceOf(user1.address);
    const nonDistributed = (await airDrop.releases(firstRelease)).balance;
    const lockedReserveBeforeStop = await airDrop.lockedReserve();

    await airDrop.connect(owner).stopRelease(firstRelease);

    expect(await airDrop.lockedReserve()).to.be.eq(lockedReserveBeforeStop.sub(nonDistributed));
    expect((await airDrop.releases(firstRelease)).balance).to.be.eq(0);

    await expect(claim(airDrop, user1, firstRelease, tree.getHexProof(leaves[1]), rewards[1])).to.be.revertedWith(
      "InsufficientReleaseBalance"
    );
    await claim(airDrop, user1, secondRelease, tree2.getHexProof(leaves2[1]), rewards2[1]);
    expect(await usdt.balanceOf(user1.address)).to.be.equal(balance1.add(rewards2[1]));

    await expect(airDrop.connect(owner).stopRelease(firstRelease)).to.be.revertedWith("ReleaseWithdrawn");
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

      await usdt.connect(owner).transfer(airDropRuleBased.address, dropAmount);
      await airDropRuleBased.release(tree.getHexRoot(), dropAmount, ruleHash);
    });
    it("Should not release with an incorrect rule hash passed", async () => {
      const encoder = new TextEncoder();
      const wrongRrule = encoder.encode("Wrong Test Rule");

      const wrongRuleHash = ethers.utils.solidityKeccak256(["bytes"], [wrongRrule]);

      await usdt.connect(owner).transfer(airDropRuleBased.address, dropAmount);
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

      await usdt.connect(owner).transfer(airDropRuleBased.address, dropAmount);
      await airDropRuleBased.release(tree.getHexRoot(), dropAmount, newRuleHash);
    });
    it("Only owner can set new rule", async () => {
      await expect(airDropRuleBased.connect(user).setRule(rule)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
