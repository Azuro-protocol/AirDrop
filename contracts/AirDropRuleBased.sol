// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.19;

import "./interface/IAirDropRuleBased.sol";
import "./AirDrop.sol";

/**
 @title  AirDropRuleBased
 @notice A contract for rule-based airdrop distribution using a Merkle tree.
 */
contract AirDropRuleBased is AirDrop, IAirDropRuleBased {
    bytes32 public ruleHash;

    /**
     * @notice Sets the rule for future airdrops.
     * @param  rule The new rule to set.
     */
    function setRule(bytes calldata rule) external onlyOwner {
        bytes32 ruleHash_ = keccak256(abi.encodePacked(rule));
        ruleHash = ruleHash_;
        emit NewRule(ruleHash_, rule);
    }

    /**
     * @notice Hook that is called before each new airdrop release.
     * @notice Checks that the rule used to create the airdrop correspond to the current rule.
     * @param  data The hash of the rule used for the airdrop.
     */
    function _beforeRelease(
        bytes32 merkleRoot_,
        uint256 amount,
        bytes calldata data
    ) internal virtual override {
        if (bytes32(data) != ruleHash) revert WrongRuleHash();
    }
}
