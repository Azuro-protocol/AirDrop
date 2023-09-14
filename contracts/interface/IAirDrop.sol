// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.19;

interface IAirDrop {
    struct Release {
        bytes32 merkleRoot;
        uint256 balance;
    }

    event Claimed(
        uint256 indexed releaseId,
        address indexed claimer,
        uint256 amount
    );
    event Released(
        uint256 indexed releaseId,
        bytes32 merleRoot,
        uint256 amount
    );

    error AlreadyClaimed();
    error AmountMustNotBeZero();
    error IncorrectData();
    error InsufficientContractBalance();
    error InsufficientReleaseBalance();
    error ReleaseDoesNotExist();
    error WrongToken();

    function claim(
        uint256 releaseId,
        bytes32[] calldata merkleProof,
        uint256 amount
    ) external;

    function release(
        bytes32 merkleRoot,
        uint256 amount,
        bytes calldata data
    ) external;
}
