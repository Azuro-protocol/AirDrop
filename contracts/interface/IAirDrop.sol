// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.19;

interface IAirDrop {
    event Claimed(address indexed claimer, uint256 amount);
    event Released(uint256 amount);

    error AlreadyClaimed();
    error AmountMustNotBeZero();
    error IncorrectData();
    error WrongToken();

    function claim(bytes32[] calldata merkleProof, uint256 amount) external;

    function release(
        bytes32 merkleRoot,
        uint256 amount,
        bytes calldata data
    ) external;
}
