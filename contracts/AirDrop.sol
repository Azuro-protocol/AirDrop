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
    mapping(uint256 => Release) public releases;
    mapping(uint256 => mapping(address => bool)) public isClaimed;

    IERC20 public token;
    uint256 public lastReleaseId;

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
     * @param  merkleRoot The root of the Merkle tree where every leaf is a 52-byte record [releaseId|address|reward]
     *         hashed with keccak-256 (see https://en.wikipedia.org/wiki/Merkle_tree).        ^32B      ^20B   ^32B
     * @param  amount Total airdrop amount.
     * @param  data Bytes optional data to send along with the call.
     */
    function release(
        bytes32 merkleRoot,
        uint256 amount,
        bytes calldata data
    ) external virtual onlyOwner {
        if (amount == 0) revert AmountMustNotBeZero();

        _beforeRelease(merkleRoot, amount, data);

        uint256 releaseId = ++lastReleaseId;
        releases[releaseId] = Release(merkleRoot, amount);

        TransferHelper.safeTransferFrom(
            address(token),
            msg.sender,
            address(this),
            amount
        );

        emit Released(releaseId, merkleRoot, amount);
    }

    /**
     * @notice Get `amount` of tokens from the airdrop `releaseId`.
     * @param  releaseId The ID of the airdrop.
     * @param  merkleProof Merkle's proof of rewarding `msg.sender` with `amount` of tokens in the airdrop `releaseId`
     *         (see https://en.wikipedia.org/wiki/Merkle_tree).
     * @param  amount The amount of tokens to be claimed.
     */
    function claim(
        uint256 releaseId,
        bytes32[] calldata merkleProof,
        uint256 amount
    ) external override {
        Release memory release_ = releases[releaseId];
        if (release_.merkleRoot == bytes32(0)) revert ReleaseDoesNotExist();
        if (
            !MerkleProof.verify(
                merkleProof,
                release_.merkleRoot,
                keccak256(abi.encodePacked(releaseId, msg.sender, amount))
            )
        ) revert IncorrectData();
        if (isClaimed[releaseId][msg.sender]) revert AlreadyClaimed();
        if (amount > release_.balance) revert InsufficientReleaseBalance();

        isClaimed[releaseId][msg.sender] = true;
        releases[releaseId].balance = release_.balance - amount;
        TransferHelper.safeTransfer(address(token), msg.sender, amount);

        emit Claimed(releaseId, msg.sender, amount);
    }

    /**
     * @notice Hook that is called before each new airdrop release.
     */
    function _beforeRelease(
        bytes32 merkleRoot,
        uint256 amount,
        bytes calldata data
    ) internal virtual {}
}
