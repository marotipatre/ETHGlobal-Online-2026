// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title Todo
 * @notice Simple todo contract deployed on Arc Chain
 * @dev This is the actual app logic - normal Solidity with no cross-chain logic
 */
contract Todo {
    struct TodoItem {
        uint256 id;
        string text;
        bool completed;
    }

    TodoItem[] public todos;
    uint256 public nextId;

    event TodoAdded(uint256 indexed id, string text);
    event TodoToggled(uint256 indexed id, bool completed);
    event TodoDeleted(uint256 indexed id);

    /**
     * @notice Adds a new todo item
     * @param text The text content of the todo
     * @return The ID of the newly created todo
     */
    function addTodo(string memory text) external returns (uint256) {
        require(bytes(text).length > 0, "Todo text cannot be empty");
        
        uint256 id = nextId;
        todos.push(TodoItem({
            id: id,
            text: text,
            completed: false
        }));
        nextId++;

        emit TodoAdded(id, text);
        return id;
    }

    /**
     * @notice Toggles the completion status of a todo
     * @param id The ID of the todo to toggle
     */
    function toggleTodo(uint256 id) external {
        require(id < todos.length, "Todo does not exist");
        
        todos[id].completed = !todos[id].completed;
        emit TodoToggled(id, todos[id].completed);
    }

    /**
     * @notice Deletes a todo item
     * @param id The ID of the todo to delete
     */
    function deleteTodo(uint256 id) external {
        require(id < todos.length, "Todo does not exist");
        
        // Move the last element to the deleted position
        uint256 lastIndex = todos.length - 1;
        if (id != lastIndex) {
            todos[id] = todos[lastIndex];
        }
        todos.pop();

        emit TodoDeleted(id);
    }

    /**
     * @notice Gets all todos
     * @return An array of all todo items
     */
    function getTodos() external view returns (TodoItem[] memory) {
        return todos;
    }

    /**
     * @notice Gets a specific todo by ID
     * @param id The ID of the todo
     * @return The todo item
     */
    function getTodo(uint256 id) external view returns (TodoItem memory) {
        require(id < todos.length, "Todo does not exist");
        return todos[id];
    }

    /**
     * @notice Gets the total count of todos
     * @return The number of todos
     */
    function getTodoCount() external view returns (uint256) {
        return todos.length;
    }
}
