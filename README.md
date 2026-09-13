## ArcFlow — Arc-native USDC Vault · Cross-Chain Intent Protocol

> Built on **Arc** — Circle's purpose-built EVM-compatible L1 — using **Arc USDC** as the native stablecoin.

ArcFlow is a cross-chain intent forwarding protocol that lets users control an **Arc-native USDC vault** from any supported EVM chain — Somnia Testnet, Base Sepolia, or Monad Testnet — without bridging or switching networks.

**Core Circle / Arc stack used:**
- **Arc Testnet** — destination execution chain (Circle's EVM L1)
- **Arc USDC** (`0x3600000000000000000000000000000000000000`) — native stablecoin powering the vault
- **ArcGateway** — source-chain intent entry point (deployed on 3 testnets)
- **ArcExecutor** — Arc-side authorization and dispatch contract
- **StablecoinVault** — 1:1 USDC-backed vault with deposit, withdraw, and harvest

The flagship demo is the [USDC Vault](/src/app/vault/page.tsx). Fund it with **Arc Testnet USDC**, then submit deposit, withdraw, or harvest instructions from any supported source chain. Counter and Todo remain under **Basic Testing** as pipeline primitives.

This is a **testnet, centralized-relayer prototype**. Source-chain assets do not move to Arc when an intent is forwarded — users fund Arc-side liquidity directly. The UI does not advertise APY. Yield is real test USDC separately funded by the vault owner.

## 🎯 What is ArcFlow?

ArcFlow is a **cross-chain intent forwarding system** for controlling Arc-side contracts from deployed source gateways.

### The Problem
- Users must switch networks in their wallet
- Users need to bridge funds to destination chains
- Complex UX with multiple transaction confirmations
- High gas costs on multiple chains

### The Solution
- ✅ **Source-side management** - Once Arc liquidity is funded, users can send management intents from a supported source network
- ✅ **No bridge inside ArcFlow** - Gateway forwards instructions, not funds
- ✅ **Any Wallet** - MetaMask, Phantom, Coinbase Wallet, etc.
- ✅ **Normal Solidity** - Write contracts as usual, no special logic needed
- ✅ **Same EVM address on Arc** - The vault attributes shares and Arc payouts to the source signer address

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
- **Source network selection** - Switch your wallet among the configured source testnets
- **Explicit Arc funding** - The vault cannot deposit USDC that is absent on Arc
- **Any Wallet** - MetaMask, Phantom, Coinbase Wallet, etc.
- **Simple UX** - One transaction, automatic execution

### For Developers
- **Normal Solidity** - Write contracts as usual
- **Simple Integration** - Just add the UI kit component
- **Flexible** - Works with any smart contract on Arc
- **Prototype scope** - Testnet-only with a trusted relayer; review and stronger proof verification required before production

### Technical Features
- ✅ Event-based intent forwarding
- ✅ Nonce-based replay protection
- ✅ Relayer authorization system
- ✅ Custom calldata support
- ✅ Comprehensive test coverage
- ✅ Typed React/viem integration
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
cd arcflow
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

Copy `.env.example` to `.env.local` and `web3-hardhat-intent/.env.example` to `web3-hardhat-intent/.env`. Add the funded, authorized relayer `PRIVATE_KEY` only to the latter. Never commit either live env file. The example contains public addresses for the active Somnia, Base Sepolia, Monad Testnet, and Arc Testnet deployments.

The wallet must connect to one of the configured source networks. Base Sepolia and Monad Testnet gateways were deployed at the blocks listed in the relayer example. Sepolia, Arbitrum Sepolia, and OP Sepolia appear as unavailable until a gateway address and relayer settings are supplied; no transaction can be forwarded through an unconfigured network.

### Running the Application

1. **Start the UI and relayer together:**
```bash
npm run dev
```

   This requires both sets of dependencies (`npm ci` at the root and in `web3-hardhat-intent/`) plus the private relayer env file. To inspect the UI alone, use `npm run dev:ui`; the progress view will show the relayer offline.

2. **Or run the relayer separately:**
```bash
cd web3-hardhat-intent
npm run relayer
```

3. **Open your browser:**
Navigate to `http://localhost:3000`

The local app and relayer share `public/intent-history.json` and the direct intent queue on the same filesystem. The UI shows signing, source confirmation, relayer detection, Arc execution, and explorer links. A serverless deployment needs a shared durable queue and history store before the same live tracking will work across separate hosts.

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
arcflow/
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
