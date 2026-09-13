# 🌉 Cross-Chain Intent Architecture

A minimal, production-ready implementation of cross-chain intent forwarding between source chains (Ethereum/Somnia) and Arc Chain.

## 📋 Overview

This project implements a cross-chain intent system where users can trigger actions on Arc Chain by signing transactions on source chains like Ethereum or Somnia. The system uses a relayer to forward intents and execute them on the destination chain.

### Architecture Components

```
Source Chain (Ethereum/Somnia)          Arc Chain (Destination)
┌─────────────────────────┐            ┌─────────────────────────┐
│                         │            │                         │
│   User signs tx         │            │   Counter (App Logic)   │
│         ↓               │            │         ↑               │
│   ArcGateway.sol        │            │         │               │
│   (Intent Forwarding)   │            │   ArcExecutor.sol       │
│         │               │            │   (Intent Execution)    │
│         │ Emits Event   │            │         ↑               │
└─────────┼───────────────┘            └─────────┼───────────────┘
          │                                      │
          └──────────► Relayer ─────────────────┘
                    (Off-chain service)
```

## 🏗️ Smart Contracts

### 1. Counter.sol (Arc Chain)
Simple counter app demonstrating normal Solidity logic.

```solidity
// Normal Solidity - no cross-chain logic
contract Counter {
    uint256 public count;
    function increment() external { count += 1; }
}
```

### 2. ArcExecutor.sol (Arc Chain)
Receives and executes forwarded intents on behalf of users.

**Features:**
- ✅ Relayer authorization system
- ✅ Intent execution with fallback handling
- ✅ Support for custom calldata
- ✅ Event emission for tracking

### 3. ArcGateway.sol (Source Chain)
Forwards user intents to Arc Chain via events.

**Features:**
- ✅ Zero state (just intent forwarding)
- ✅ Nonce tracking for replay protection
- ✅ Support for custom calldata
- ✅ Gas-efficient event emission

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Private key with funds on Arc Testnet and Source Chain

### Installation

1. **Install dependencies:**
```bash
cd web3-hardhat-intent
npm install
```

2. **Configure environment:**
Create a `.env` file:
```bash
# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Network RPCs
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
SOMNIA_TESTNET_RPC_URL=https://dream-rpc.somnia.network/
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Contract addresses (fill after deployment)
COUNTER_ADDRESS=
ARC_EXECUTOR_ADDRESS=
ARC_GATEWAY_ADDRESS=

# Relayer config
RELAYER_ADDRESS=
RELAYER_POLL_INTERVAL=5000
```

### Compile Contracts

```bash
npm run compile
```

## 📦 Deployment

### Step 1: Deploy on Arc Testnet

Deploy Counter and ArcExecutor contracts:

```bash
npx hardhat run scripts/deploy-arc.ts --network arcTestnet
```

**Output:**
```
✅ Counter deployed to: 0x...
✅ ArcExecutor deployed to: 0x...
```

Add these addresses to your `.env` file.

### Step 2: Deploy Gateway on Source Chain

Deploy ArcGateway on Somnia Testnet or Sepolia:

```bash
# Somnia Testnet
npx hardhat run scripts/deploy-gateway.ts --network somniaTestnet

# OR Sepolia
npx hardhat run scripts/deploy-gateway.ts --network sepolia
```

**Output:**
```
✅ ArcGateway deployed to: 0x...
```

Add the gateway address to your `.env` file.

### Step 3: Authorize Relayer

Get your relayer address and add it to `.env`:
```bash
RELAYER_ADDRESS=your_wallet_address
```

Then authorize the relayer:

```bash
npx hardhat run scripts/setup-relayer.ts --network arcTestnet
```

## 🔄 Running the Relayer

The relayer listens for `IntentForwarded` events on the source chain and executes them on Arc Chain.

### Start the Relayer

```bash
npm run relayer
```

**Output:**
```
🔧 Initializing Intent Relayer...
✅ Relayer is authorized
👂 Listening for IntentForwarded events...
```

### How It Works

1. **Listens**: Polls source chain for new blocks
2. **Detects**: Finds `IntentForwarded` events
3. **Executes**: Calls `ArcExecutor.execute()` on Arc Chain
4. **Logs**: Outputs execution results

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Coverage

- ✅ **Counter.test.ts** - Counter contract functionality
- ✅ **ArcGateway.test.ts** - Intent forwarding and nonce management
- ✅ **ArcExecutor.test.ts** - Intent execution and authorization
- ✅ **Integration.test.ts** - End-to-end cross-chain flow

### Local Testing

For local development, you can deploy everything to localhost:

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy-local.ts --network localhost

# Terminal 3: Run relayer
npm run relayer
```

## 📖 Usage Examples

### Example 1: Forward Simple Intent

On source chain (Ethereum/Somnia):

```typescript
const gateway = new ethers.Contract(GATEWAY_ADDRESS, ABI, signer);
const tx = await gateway.forwardIntent(COUNTER_ADDRESS);
await tx.wait();
```

The relayer will automatically:
1. Detect the event
2. Execute on Arc Chain
3. Increment the counter

### Example 2: Forward Intent with Custom Data

```typescript
const counter = new ethers.Contract(COUNTER_ADDRESS, COUNTER_ABI, provider);
const calldata = counter.interface.encodeFunctionData("increment");

const gateway = new ethers.Contract(GATEWAY_ADDRESS, GATEWAY_ABI, signer);
const tx = await gateway.forwardIntentWithData(COUNTER_ADDRESS, calldata);
await tx.wait();
```

## 🔐 Security Considerations

### Current Implementation (MVP)
- ✅ Relayer authorization system
- ✅ Nonce-based replay protection
- ✅ Event-based intent forwarding
- ⚠️ No cryptographic proofs
- ⚠️ Centralized relayer

### Production Enhancements Needed
- 🔒 Add signature verification
- 🔒 Implement gateway proofs
- 🔒 Add Universal Arc Account mapping
- 🔒 Decentralize relayer network
- 🔒 Add timeout mechanisms
- 🔒 Implement intent cancellation

## 📊 Network Information

### Arc Testnet
- **Chain ID:** 5042002
- **RPC:** https://rpc.testnet.arc.network
- **Currency:** USDC
- **Explorer:** https://testnet.arcscan.app

### Somnia Testnet
- **Chain ID:** 50312
- **RPC:** https://dream-rpc.somnia.network/
- **Explorer:** https://shannon-explorer.somnia.network/

### Sepolia Testnet
- **Chain ID:** 11155111
- **RPC:** https://sepolia.infura.io/v3/YOUR_KEY
- **Explorer:** https://sepolia.etherscan.io

## 🛠️ Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Arc Testnet
npm run deploy:arc

# Deploy gateway to Ethereum
npm run deploy:ethereum

# Deploy locally
npm run deploy:localhost

# Run relayer
npm run relayer

# Clean artifacts
npx hardhat clean
```

## 📁 Project Structure

```
web3-hardhat-intent/
├── contracts/              # Solidity smart contracts
│   ├── Counter.sol        # App logic (Arc Chain)
│   ├── ArcExecutor.sol    # Intent executor (Arc Chain)
│   └── ArcGateway.sol     # Intent gateway (Source Chain)
├── scripts/               # Deployment scripts
│   ├── deploy-arc.ts      # Deploy Arc contracts
│   ├── deploy-gateway.ts  # Deploy gateway
│   ├── deploy-local.ts    # Deploy locally
│   └── setup-relayer.ts   # Authorize relayer
├── relayer/               # Relayer service
│   └── index.ts          # Main relayer logic
├── test/                  # Test files
│   ├── Counter.test.ts
│   ├── ArcExecutor.test.ts
│   ├── ArcGateway.test.ts
│   └── Integration.test.ts
├── hardhat.config.ts      # Hardhat configuration
└── package.json           # Dependencies
```

## 🎯 Key Features

### ✅ Production-Ready
- Comprehensive test coverage
- Gas-optimized contracts
- Error handling and fallbacks
- Event-driven architecture

### ✅ Developer-Friendly
- Type-safe TypeScript
- Clear documentation
- Example scripts
- Local testing support

### ✅ Extensible
- Support for custom calldata
- Modular architecture
- Easy to add new chains
- Pluggable relayer design

## 🔮 Future Enhancements

1. **Multi-Relayer Support**: Decentralized relayer network with consensus
2. **Proof Verification**: Add cryptographic proofs for intent validation
3. **Universal Accounts**: Implement full Universal Arc Account system
4. **Fee Management**: Add fee collection and distribution
5. **Intent Batching**: Support multiple intents in single transaction
6. **Monitoring Dashboard**: Web UI for tracking intents and relayer status

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

Built with ❤️ for the Arc Chain ecosystem
