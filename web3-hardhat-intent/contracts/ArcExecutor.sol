// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title ICounter
 * @notice Interface for the Counter contract
 */
interface ICounter {
    function increment() external;
}

/**
 * @title ITodo
 * @notice Interface for the Todo contract
 */
interface ITodo {
    function addTodo(string memory text) external returns (uint256);
    function toggleTodo(uint256 id) external;
    function deleteTodo(uint256 id) external;
}

/**
 * @title ArcExecutor
 * @notice Executor contract on Arc Chain that receives and executes forwarded intents
 * @dev This contract:
 *      - Receives forwarded intents from the gateway
 *      - Executes calls on behalf of users
 *      - Simulates Universal Arc Account execution
 *      - Supports Counter (via execute) and Todo (via executeWithData)
 */
contract ArcExecutor {
    // Maps user addresses to their Universal Arc Account addresses
    mapping(bytes32 => address) public universalAccounts;
    
    // Maps user addresses to nonces for replay protection
    mapping(address => uint256) public nonces;

    // Owner/admin for access control
    address public owner;
    
    // Authorized relayers that can call execute
    mapping(address => bool) public authorizedRelayers;

    event IntentExecuted(
        address indexed user,
        address indexed target,
        bool success
    );

    event RelayerAuthorized(address indexed relayer, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender], "Not authorized relayer");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Authorize the deployer as a relayer initially
        authorizedRelayers[msg.sender] = true;
    }

    /**
     * @notice Authorizes or revokes a relayer
     * @param relayer The relayer address
     * @param authorized Whether to authorize or revoke
     */
    function setRelayerAuthorization(address relayer, bool authorized) external onlyOwner {
        authorizedRelayers[relayer] = authorized;
        emit RelayerAuthorized(relayer, authorized);
    }

    /**
     * @notice Executes an intent on behalf of a user
     * @param user The user who initiated the intent on the source chain
     * @param target The target contract to call (e.g., Counter)
     * @dev In production, this would:
     *      - Verify gateway proof
     *      - Verify signature
     *      - Map user to Universal Arc Account
     *      For MVP: acts directly
     */
    function execute(
        address user,
        address target
    ) external onlyAuthorizedRelayer {
        // For MVP: directly execute the increment
        // In production: validate proofs, signatures, etc.
        
        bool success;
        try ICounter(target).increment() {
            success = true;
        } catch {
            success = false;
        }

        emit IntentExecuted(user, target, success);
    }

    /**
     * @notice Executes an intent with custom calldata
     * @param user The user who initiated the intent
     * @param target The target contract (e.g., Todo)
     * @param data The calldata to execute (e.g., encoded addTodo, toggleTodo, deleteTodo)
     * @dev Used for contracts that require parameters like Todo:
     *      - Todo.addTodo(string text)
     *      - Todo.toggleTodo(uint256 id)
     *      - Todo.deleteTodo(uint256 id)
     *      Can also be used for any other contract with custom function calls
     */
    function executeWithData(
        address user,
        address target,
        bytes calldata data
    ) external onlyAuthorizedRelayer {
        // Execute arbitrary call (supports Todo and any other contract)
        (bool success, ) = target.call(data);
        
        emit IntentExecuted(user, target, success);
    }
}
