// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "./interface/IAirDrop.sol";

contract AirDrop is OwnableUpgradeable, IAirDrop {
    address public token;

    bytes32 public merkleRoot;
    uint32 nonce;

    mapping(address => uint32) public claimed;

    function initialize(address token_) public virtual initializer {
        if (token_ == address(0)) revert WrongToken();
        __Ownable_init();
        token = token_;
    }

    function charge(bytes32 merkleRoot_, uint256 amount_) external override onlyOwner {
        merkleRoot = merkleRoot_;
        nonce++;
        TransferHelper.safeTransferFrom(
            token,
            msg.sender,
            address(this),
            amount_
        );
        emit Charged(amount_);
    }

    function claim(bytes32[] calldata merkleProof_, uint256 amount_) external override {
        if (
            !MerkleProof.verify(
                merkleProof_,
                merkleRoot,
                keccak256(abi.encodePacked(amount_, msg.sender))
            )
        ) revert IncorrectData();
        if (claimed[msg.sender] == nonce) revert AlreadyClaimed();

        claimed[msg.sender] = nonce;

        TransferHelper.safeTransfer(token, msg.sender, amount_);

        emit Claimed(msg.sender, amount_);
    }
}
