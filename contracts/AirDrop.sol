// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "./interface/IAirDrop.sol";

/**
 * @notice A contract for airdrop distribution using a Merkle tree.
 */
contract AirDrop is OwnableUpgradeable, IAirDrop {
    IERC20 public token;

    bytes32 public merkleRoot;
    uint32 nonce;

    mapping(address => uint32) public claimed;

    /**
     * @param  token_ Address of the token used in airdrops.
     */
    function initialize(address token_) external virtual initializer {
        if (token_ == address(0)) revert WrongToken();

        __Ownable_init();
        token = IERC20(token_);
    }

    /**
     * @notice Release new airdrop of `amount` tokens.
     * @notice Removes the previous airdrop. Any funds that were not distributed in the previous airdrop will be used
     *         in the released airdrop.
     * @param  merkleRoot_ The root of the Merkle tree where every leaf is a 52-byte record [address|reward] hashed
     *         with keccak-256 (see https://en.wikipedia.org/wiki/Merkle_tree).                ^20B   ^32B
     * @param  amount Total airdrop amount.
     * @param  data Bytes optional data to send along with the call.
     */
    function release(
        bytes32 merkleRoot_,
        uint256 amount,
        bytes calldata data
    ) external virtual onlyOwner {
        if (amount == 0) revert AmountMustNotBeZero();

        _beforeRelease(merkleRoot_, amount, data);

        merkleRoot = merkleRoot_;
        ++nonce;

        uint256 balance = token.balanceOf(address(this));
        TransferHelper.safeTransferFrom(
            address(token),
            msg.sender,
            address(this),
            amount > balance ? amount - balance : 0
        );

        emit Released(amount);
    }

    /**
     * @notice Get `amount` of tokens from the current airdrop.
     * @param  merkleProof Merkle's proof of rewarding `msg.sender` with `amount` of tokens in the current airdrop
     *         (see https://en.wikipedia.org/wiki/Merkle_tree).
     * @param  amount The amount of tokens to be claimed.
     */
    function claim(bytes32[] calldata merkleProof, uint256 amount)
        external
        override
    {
        if (
            !MerkleProof.verify(
                merkleProof,
                merkleRoot,
                keccak256(abi.encodePacked(msg.sender, amount))
            )
        ) revert IncorrectData();
        if (claimed[msg.sender] == nonce) revert AlreadyClaimed();

        claimed[msg.sender] = nonce;

        TransferHelper.safeTransfer(address(token), msg.sender, amount);

        emit Claimed(msg.sender, amount);
    }

    /**
     * @notice Hook that is called before each new airdrop release.
     */
    function _beforeRelease(
        bytes32 merkleRoot_,
        uint256 amount,
        bytes calldata data
    ) internal virtual {}
}
