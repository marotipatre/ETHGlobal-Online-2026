// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Minimal CCTP TokenMessenger interface (Circle's Cross-Chain Transfer Protocol)
interface ITokenMessenger {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 nonce);
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @notice Thin wrapper around Circle CCTP that burns source-chain USDC and
///         emits a BridgeInitiated event so the ArcFlow relayer can correlate
///         the CCTP transfer with a pending vault deposit intent.
/// @dev    Arc Testnet domain ID = 9 (Circle's assigned domain for Arc).
///         The mintRecipient on Arc is the StablecoinVault address, which
///         calls fundFor(user, amount) upon receiving the USDC mint.
contract CctpBridgeGateway {
    ITokenMessenger public immutable tokenMessenger;
    IERC20 public immutable usdc;
    uint32 public constant ARC_DOMAIN = 9;

    event BridgeInitiated(
        address indexed sender,
        bytes32 indexed mintRecipient,
        uint256 amount,
        uint64 cctpNonce
    );

    constructor(address tokenMessenger_, address usdc_) {
        require(tokenMessenger_ != address(0) && usdc_ != address(0), "Zero address");
        tokenMessenger = ITokenMessenger(tokenMessenger_);
        usdc = IERC20(usdc_);
    }

    /// @notice Burns USDC on the source chain via CCTP and targets mintRecipient on Arc.
    /// @param amount       Amount of USDC (6 decimals) to bridge.
    /// @param mintRecipient The Arc-side address (as bytes32) that will receive the minted USDC.
    ///                      Typically the StablecoinVault address.
    function bridgeToArc(uint256 amount, bytes32 mintRecipient) external returns (uint64 nonce) {
        require(amount > 0, "Zero amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        require(usdc.approve(address(tokenMessenger), amount), "Approve failed");
        nonce = tokenMessenger.depositForBurn(amount, ARC_DOMAIN, mintRecipient, address(usdc));
        emit BridgeInitiated(msg.sender, mintRecipient, amount, nonce);
    }

    /// @notice Convenience: returns the bytes32 form of an address for mintRecipient.
    function addressToBytes32(address addr) external pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
