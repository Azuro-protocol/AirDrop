// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

interface IAirDrop {
    event Claimed(address indexed claimer, uint256 amount);
    event Charged(uint256 amount_);

    function charge(bytes32 merkleRoot_, uint256 amount_) external;

    function claim(bytes32[] calldata merkleProof_, uint256 amount_) external;

    error WrongToken();

    error IncorrectData();
    error AlreadyClaimed();
}
