// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title Counter
 * @notice Simple counter contract deployed on Arc Chain
 * @dev This is the actual app logic - normal Solidity with no cross-chain logic
 */
contract Counter {
    uint256 public count;

    event Incremented(uint256 newCount);

    /**
     * @notice Increments the counter by 1
     * @dev Uses msg.sender as expected in normal Solidity
     */
    function increment() external {
        count += 1;
        emit Incremented(count);
    }

    /**
     * @notice Gets the current count
     * @return The current count value
     */
    function getCount() external view returns (uint256) {
        return count;
    }
}
