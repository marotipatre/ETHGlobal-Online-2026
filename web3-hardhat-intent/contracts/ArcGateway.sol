// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title ArcGateway
 * @notice Gateway contract deployed on Ethereum (source chain)
 * @dev This contract's only job is to:
 *      - Accept signed transactions
 *      - Forward intent data to Arc via events
 *      ❗ No execution, no state, no assets - just intent forwarding
 */
contract ArcGateway {
    // Nonces for replay protection
    mapping(address => uint256) public nonces;

    event IntentForwarded(
        address indexed user,
        address indexed target,
        uint256 nonce,
        uint256 timestamp
    );

    event IntentForwardedWithData(
        address indexed user,
        address indexed target,
        bytes data,
        uint256 nonce,
        uint256 timestamp
    );

    /**
     * @notice Forwards an intent to Arc Chain
     * @param target The target contract address on Arc Chain
     * @dev The user is msg.sender (signed on source chain)
     *      This just emits an event that the relayer will pick up
     */
    function forwardIntent(address target) external {
        uint256 currentNonce = nonces[msg.sender];
        nonces[msg.sender] = currentNonce + 1;

        emit IntentForwarded(
            msg.sender,
            target,
            currentNonce,
            block.timestamp
        );
    }

    /**
     * @notice Forwards an intent with custom calldata to Arc Chain
     * @param target The target contract address on Arc Chain
     * @param data The calldata to execute on Arc
     */
    function forwardIntentWithData(
        address target,
        bytes calldata data
    ) external {
        uint256 currentNonce = nonces[msg.sender];
        nonces[msg.sender] = currentNonce + 1;

        emit IntentForwardedWithData(
            msg.sender,
            target,
            data,
            currentNonce,
            block.timestamp
        );
    }

    /**
     * @notice Gets the current nonce for a user
     * @param user The user address
     * @return The current nonce
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
}
