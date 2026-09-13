// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IVaultUSDC {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @notice Arc-native, 1:1 USDC vault. Source intents only control funds already on Arc.
/// @dev No bridge or investment strategy is implied. Yield is explicitly sponsor-funded.
contract StablecoinVault {
    IVaultUSDC public immutable usdc;
    address public immutable executor;
    address public owner;
    bool public paused;
    uint256 public totalShares;
    uint256 public totalPending;
    uint256 public yieldReserve;
    uint256 public accYieldPerShare;
    uint256 private constant SCALE = 1e18;
    uint256 private lockState = 1;

    mapping(address => uint256) public pending;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public accrued;

    event Funded(address indexed payer, address indexed user, uint256 amount);
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event YieldFunded(address indexed sponsor, uint256 amount);
    event Harvested(address indexed user, uint256 amount);
    event Paused(bool value);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyExecutor() { require(msg.sender == executor, "Not executor"); _; }
    modifier whenActive() { require(!paused, "Paused"); _; }
    modifier nonReentrant() { require(lockState == 1, "Reentrant"); lockState = 2; _; lockState = 1; }

    constructor(address token_, address executor_) {
        require(token_ != address(0) && executor_ != address(0), "Zero address");
        usdc = IVaultUSDC(token_);
        executor = executor_;
        owner = msg.sender;
    }

    function setPaused(bool value) external onlyOwner { paused = value; emit Paused(value); }

    function fundFor(address user, uint256 amount) external whenActive nonReentrant {
        require(user != address(0) && amount > 0, "Invalid funding");
        uint256 beforeBalance = usdc.balanceOf(address(this));
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        require(usdc.balanceOf(address(this)) - beforeBalance == amount, "Fee token unsupported");
        pending[user] += amount;
        totalPending += amount;
        emit Funded(msg.sender, user, amount);
    }

    /// @notice Pending USDC is reclaimable by its beneficiary without a relayer.
    function reclaimPending(uint256 amount) external nonReentrant {
        require(amount > 0 && pending[msg.sender] >= amount, "Insufficient pending");
        pending[msg.sender] -= amount;
        totalPending -= amount;
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
    }

    function depositFor(address user, uint256 amount) external onlyExecutor whenActive nonReentrant {
        require(user != address(0) && amount > 0 && pending[user] >= amount, "Insufficient pending");
        _accrue(user);
        pending[user] -= amount;
        totalPending -= amount;
        shares[user] += amount;
        totalShares += amount;
        rewardDebt[user] = shares[user] * accYieldPerShare / SCALE;
        emit Deposited(user, amount);
    }

    function withdrawFor(address user, uint256 amount) external onlyExecutor whenActive nonReentrant {
        require(user != address(0) && amount > 0 && shares[user] >= amount, "Insufficient shares");
        _accrue(user);
        shares[user] -= amount;
        totalShares -= amount;
        rewardDebt[user] = shares[user] * accYieldPerShare / SCALE;
        require(usdc.transfer(user, amount), "Transfer failed");
        emit Withdrawn(user, amount);
    }

    /// @notice Owner can sponsor a real, funded demo reward; this is not protocol APY.
    function fundYield(uint256 amount) external onlyOwner whenActive nonReentrant {
        require(amount > 0 && totalShares > 0, "No active shares");
        uint256 beforeBalance = usdc.balanceOf(address(this));
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        require(usdc.balanceOf(address(this)) - beforeBalance == amount, "Fee token unsupported");
        yieldReserve += amount;
        accYieldPerShare += amount * SCALE / totalShares;
        emit YieldFunded(msg.sender, amount);
    }

    function harvestFor(address user) external onlyExecutor whenActive nonReentrant {
        require(user != address(0), "Zero user");
        _accrue(user);
        uint256 amount = accrued[user];
        require(amount > 0 && amount <= yieldReserve, "No funded yield");
        accrued[user] = 0;
        rewardDebt[user] = shares[user] * accYieldPerShare / SCALE;
        yieldReserve -= amount;
        require(usdc.transfer(user, amount), "Transfer failed");
        emit Harvested(user, amount);
    }

    function claimable(address user) external view returns (uint256) {
        return accrued[user] + shares[user] * accYieldPerShare / SCALE - rewardDebt[user];
    }

    function backing() external view returns (uint256 balance, uint256 liabilities) {
        balance = usdc.balanceOf(address(this));
        liabilities = totalShares + totalPending + yieldReserve;
    }

    function _accrue(address user) private {
        accrued[user] += shares[user] * accYieldPerShare / SCALE - rewardDebt[user];
    }
}
