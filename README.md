
## 🎯 What is Universal App Kit?

Universal App Kit is a **cross-chain intent forwarding system** that solves the biggest friction point in multi-chain applications: **network switching and bridging**.

### The Problem
- Users must switch networks in their wallet
- Users need to bridge funds to destination chains
- Complex UX with multiple transaction confirmations
- High gas costs on multiple chains

### The Solution
- ✅ **No Network Switching** - Users stay on their preferred chain
- ✅ **No Bridging Required** - Gateway handles intent forwarding
- ✅ **Any Wallet** - MetaMask, Phantom, Coinbase Wallet, etc.
- ✅ **Normal Solidity** - Write contracts as usual, no special logic needed
- ✅ **Universal Arc Account** - One smart account on Arc for all external wallets

---

## 🏗️ Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                    Cross-Chain Intent System                          │
└───────────────────────────────────────────────────────────────────────┘

SOURCE CHAIN                    OFF-CHAIN                  ARC CHAIN
(Ethereum/Somnia)               (Relayer)                 (Destination)
────────────────                ─────────                 ─────────────

┌──────────────┐                                         ┌──────────────┐
│              │                                         │              │
│     User     │                                         │   Counter    │
│   Wallet     │                                         │ (App Logic)  │
│              │                                         │              │
└──────┬───────┘                                         └──────▲───────┘
       │                                                        │
       │ 1. Sign Transaction                                   │
       │    forwardIntent()                                    │
       │                                                        │
       ▼                                                        │
┌──────────────┐               ┌──────────────┐         ┌─────┴────────┐
│              │               │              │         │              │
│  ArcGateway  │──────────────▶│   Relayer    │────────▶│ ArcExecutor  │
│   Contract   │  2. Emit      │   Service    │ 3. Call │   Contract   │
│              │     Event      │              │ execute()│              │
└──────────────┘               └──────────────┘         └──────────────┘
```

### Key Components

1. **ArcGateway.sol** (Source Chain)
   - Deployed on Ethereum, Somnia, or any EVM chain
   - Accepts user-signed transactions
   - Emits `IntentForwarded` events
   - Zero state, gas-efficient forwarding

2. **Relayer Service** (Off-Chain)
   - Monitors source chain for `IntentForwarded` events
   - Processes intents and executes on Arc Chain
   - Handles errors and retries
   - Maintains intent history

3. **ArcExecutor.sol** (Arc Chain)
   - Receives forwarded intents from relayer
   - Verifies relayer authorization
   - Executes calls on target contracts
   - Manages Universal Arc Account mapping

4. **Your Application** (Arc Chain)
   - Standard Solidity contracts
   - No cross-chain logic needed
   - Works exactly as if called directly

---

## ✨ Key Features

### For Users
- **No Network Switching** - Use your wallet on any chain
- **No Bridging** - No need to bridge funds to Arc
- **Any Wallet** - MetaMask, Phantom, Coinbase Wallet, etc.
- **Simple UX** - One transaction, automatic execution

### For Developers
- **Normal Solidity** - Write contracts as usual
- **Simple Integration** - Just add the UI kit component
- **Flexible** - Works with any smart contract on Arc
- **Production-Ready** - Comprehensive tests and error handling

### Technical Features
- ✅ Event-based intent forwarding
- ✅ Nonce-based replay protection
- ✅ Relayer authorization system
- ✅ Custom calldata support
- ✅ Comprehensive test coverage
- ✅ Type-safe TypeScript SDK
- ✅ Real-time intent tracking

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **MetaMask** or compatible wallet
- Private key with testnet funds (for relayer)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd universal-kit
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Install smart contract dependencies:**
```bash
cd web3-hardhat-intent
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:
```env
# Source Chain (Somnia Testnet)
NEXT_PUBLIC_ARC_GATEWAY_ADDRESS=0xD5Bb85Ee81342ea97A240b21156d33cb3a4Df985

# Arc Chain
NEXT_PUBLIC_COUNTER_ADDRESS=0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD
NEXT_PUBLIC_ARC_EXECUTOR_ADDRESS=0x90Dfd581393104EAe03Fd349b4867A7E8F51313b
```

Create a `.env` file in `web3-hardhat-intent/`:
```env
# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Network RPCs
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
SOMNIA_TESTNET_RPC_URL=https://dream-rpc.somnia.network/
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Contract addresses (fill after deployment)
ARC_GATEWAY_ADDRESS=0xD5Bb85Ee81342ea97A240b21156d33cb3a4Df985
ARC_EXECUTOR_ADDRESS=0x90Dfd581393104EAe03Fd349b4867A7E8F51313b
COUNTER_ADDRESS=0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD
TODO_ADDRESS=

# Relayer config
RELAYER_ADDRESS=
RELAYER_POLL_INTERVAL=5000
```

### Running the Application

1. **Start the frontend:**
```bash
npm run dev
```

2. **In a separate terminal, start the relayer:**
```bash
cd web3-hardhat-intent
npm run relayer
```

3. **Open your browser:**
Navigate to `http://localhost:3000`

---

## 📦 Deployment

### Step 1: Deploy Contracts on Arc Testnet

Deploy Counter and ArcExecutor contracts:
```bash
cd web3-hardhat-intent
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
```env
RELAYER_ADDRESS=your_wallet_address
```

Then authorize the relayer:
```bash
npx hardhat run scripts/setup-relayer.ts --network arcTestnet
```

---

## 🔄 How It Works

### User Flow

1. **User connects wallet** on any source chain (Ethereum, Somnia, etc.)
2. **User signs transaction** calling `ArcGateway.forwardIntent(target)`
3. **Gateway emits event** `IntentForwarded(user, target, nonce, timestamp)`
4. **Relayer detects event** by polling source chain
5. **Relayer executes** on Arc Chain via `ArcExecutor.execute(user, target)`
6. **Executor calls** target contract (e.g., `Counter.increment()`)
7. **Result emitted** as `IntentExecuted(user, target, success)`

### Transaction Flow Timeline

```
T0: User initiates intent on Source Chain
    ├─▶ User calls: gateway.forwardIntent(counterAddress)
    │   - Tx sent to source chain
    │   - Nonce incremented: nonces[user]++
    │
T1: Transaction confirmed on Source Chain
    ├─▶ Event emitted: IntentForwarded(user, target, nonce, timestamp)
    │   - Recorded in blockchain logs
    │   - Gas cost: ~50k gas
    │
T2: Relayer detects event (polling interval: ~5 sec)
    ├─▶ Relayer queries: gateway.queryFilter(IntentForwarded)
    │   - Reads event data from logs
    │   - Extracts: user, target, nonce
    │
T3: Relayer prepares execution on Arc
    ├─▶ Relayer checks: executor.authorizedRelayers(relayer)
    │   - Verify relayer has permission
    │
T4: Relayer executes on Arc Chain
    ├─▶ Relayer calls: executor.execute(user, target)
    │   - Tx sent to Arc Chain
    │   - Relayer pays gas on Arc
    │
T5: Executor processes intent
    ├─▶ Executor calls: Counter(target).increment()
    │   - try-catch wrapper for safety
    │   - State change: count++
    │
T6: Result emitted on Arc Chain
    └─▶ Event emitted: IntentExecuted(user, target, success)
        - Confirmation of execution
        - Gas cost: ~70k gas

Total Time: T0 → T6 = ~10-30 seconds
```

---

## 🛠️ Development

### Project Structure

```
universal-kit/
├── src/                          # Next.js frontend
│   ├── app/                      # Next.js app router
│   │   ├── page.tsx              # Homepage
│   │   └── counter-app/          # Counter demo app
│   ├── components/               # React components
│   │   ├── IntentForwarder.tsx   # Intent forwarding UI
│   │   ├── CounterDisplay.tsx    # Counter state display
│   │   ├── IntentHistory.tsx     # Intent history table
│   │   └── ui/                   # UI components
│   ├── hooks/                    # React hooks
│   │   ├── useIntent.ts          # Intent forwarding logic
│   │   ├── useWallet.ts          # Wallet connection
│   │   └── useCounter.ts         # Counter state
│   ├── lib/                      # Utilities
│   │   ├── contracts.ts          # Contract ABIs and addresses
│   │   └── wallet.ts             # Wallet utilities
│   └── config/                   # Configuration
│       └── chains.ts             # Chain definitions
│
└── web3-hardhat-intent/          # Smart contracts & relayer
    ├── contracts/                # Solidity contracts
    │   ├── ArcGateway.sol        # Intent gateway (source chain)
    │   ├── ArcExecutor.sol       # Intent executor (Arc chain)
    │   └── Counter.sol           # Example application
    ├── scripts/                  # Deployment scripts
    │   ├── deploy-arc.ts         # Deploy Arc contracts
    │   ├── deploy-gateway.ts     # Deploy gateway
    │   ├── setup-relayer.ts      # Authorize relayer
    │   └── test-flow.ts          # Test end-to-end flow
    ├── relayer/                  # Relayer service
    │   └── index.ts              # Main relayer logic
    └── test/                     # Test files
        ├── Counter.test.ts
        ├── ArcExecutor.test.ts
        ├── ArcGateway.test.ts
        └── Integration.test.ts
```
