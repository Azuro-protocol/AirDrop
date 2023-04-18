// SPDX-License-Identifier: GPL-3.0

import "./IAirDrop.sol";

pragma solidity ^0.8.4;

interface IAirDropRuleBased is IAirDrop {
    event NewRule(bytes32 indexed ruleHash, bytes rule);

    error WrongRuleHash();

    function setRule(bytes calldata rule) external;
}
