// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "./interface/IAirDrop.sol";

/// @title Azuro Farming
contract AirDrop is OwnableUpgradeable, IAirDrop {
    IERC20 public token;

    bytes32 public merkleRoot;
    uint32 nonce;

    mapping(address => uint32) public claimed;

    /**
     * @param  token_ address of the token used in drops
     */
    function initialize(address token_) external virtual initializer {
        if (token_ == address(0)) revert WrongToken();

        __Ownable_init();
        token = IERC20(token_);
    }

    /**
     * @notice Release new drop of `amount_` tokens.
     * @param  merkleRoot_ root of Merkle's tree where every leaf is hashed with keccak-256 52-bytes record [address|reward]
     *         (see https://en.wikipedia.org/wiki/Merkle_tree)                                                 ^20B   ^32B
     * @param  amount_ total drop amount
     */
    function charge(bytes32 merkleRoot_, uint256 amount_)
        external
        override
        onlyOwner
    {
        if (amount_ == 0) revert AmountMustNotBeZero();

        merkleRoot = merkleRoot_;
        nonce++;

        uint256 balance = token.balanceOf(address(this));
        TransferHelper.safeTransferFrom(
            address(token),
            msg.sender,
            address(this),
            amount_ > balance ? amount_ - balance : 0
        );

        emit Charged(amount_);
    }

    /**
     * @notice Get `amount_` of tokens from current drop.
     * @param  merkleProof_ Merkle's proof of rewarding `msg.sender` with `amount_` of tokens in the current drop
     *                      (see https://en.wikipedia.org/wiki/Merkle_tree)
     * @param  amount_ drop amount
     */
    function claim(bytes32[] calldata merkleProof_, uint256 amount_)
        external
        override
    {
        if (
            !MerkleProof.verify(
                merkleProof_,
                merkleRoot,
                keccak256(abi.encodePacked(msg.sender, amount_))
            )
        ) revert IncorrectData();
        if (claimed[msg.sender] == nonce) revert AlreadyClaimed();

        claimed[msg.sender] = nonce;

        TransferHelper.safeTransfer(address(token), msg.sender, amount_);

        emit Claimed(msg.sender, amount_);
    }
}
