// Contract ABIs in viem format
export const ARC_GATEWAY_ABI = [
  {
    inputs: [{ name: "target", type: "address" }],
    name: "forwardIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "target", type: "address" },
      { name: "data", type: "bytes" },
    ],
    name: "forwardIntentWithData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getNonce",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "target", type: "address" },
      { indexed: false, name: "nonce", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "IntentForwarded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "target", type: "address" },
      { indexed: false, name: "data", type: "bytes" },
      { indexed: false, name: "nonce", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "IntentForwardedWithData",
    type: "event",
  },
] as const;

export const COUNTER_ABI = [
  {
    inputs: [],
    name: "increment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "newCount", type: "uint256" }],
    name: "Incremented",
    type: "event",
  },
] as const;

export const TODO_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "text",
        "type": "string"
      }
    ],
    "name": "TodoAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "TodoDeleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "completed",
        "type": "bool"
      }
    ],
    "name": "TodoToggled",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "text",
        "type": "string"
      }
    ],
    "name": "addTodo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "deleteTodo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getTodo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "text",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "completed",
            "type": "bool"
          }
        ],
        "internalType": "struct Todo.TodoItem",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTodoCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTodos",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "text",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "completed",
            "type": "bool"
          }
        ],
        "internalType": "struct Todo.TodoItem[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "todos",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "text",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "completed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "toggleTodo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const ARC_EXECUTOR_ABI = [
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "target", type: "address" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "target", type: "address" },
      { name: "data", type: "bytes" },
    ],
    name: "executeWithData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "target", type: "address" },
      { indexed: false, name: "success", type: "bool" },
    ],
    name: "IntentExecuted",
    type: "event",
  },
] as const;

// Contract addresses - these should be set via environment variables
export const CONTRACT_ADDRESSES = {
  // Source chain (Somnia/Ethereum) - where user signs
  ARC_GATEWAY: process.env.NEXT_PUBLIC_ARC_GATEWAY_ADDRESS || "0xDDdE8b8073B63f86C15C67e49749B34b5fE77651",
  
  // Arc Chain - where execution happens
  COUNTER: process.env.NEXT_PUBLIC_COUNTER_ADDRESS || "0x425Fb305CDA77baD1F1565B0feCf5DC27F5bF766",
  TODO: process.env.NEXT_PUBLIC_TODO_ADDRESS || "0x027358685B192d707cbD87c9bb3a08bc7dC04Ac9",
  ARC_EXECUTOR: process.env.NEXT_PUBLIC_ARC_EXECUTOR_ADDRESS || "0x641B0a7a8dcDB2F1bFee8F463DA8d25144B73938",
} as const;
