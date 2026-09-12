# 🚀 Universal Arc Kit SDK - Complete Guide

## 🎯 What This SDK Does

**Your Situation:**
- ✅ You have a smart contract application **deployed on Arc Network**
- ✅ You want users to interact with it **from any blockchain** (Ethereum, Polygon, Solana, etc.)
- ✅ You don't want users to switch networks or bridge funds

**The Solution:**
Wrap your application component with `ArcUniversalAppKit`. Put your `<YourApp/>` component inside the wrapper, provide your contract address and ABI, and the wrapper handles everything else!

**What Happens:**
1. User connects wallet on **their preferred chain** (any chain)
2. User triggers operations through your app
3. Operations are automatically forwarded to **Arc Network**
4. Execution happens on **Arc Network** (where your app lives)
5. User never leaves their chain! ✨

---

## 🚀 Quick Start

### Step 1: Install

```bash
npm install @arc/universal-app-kit
```

### Step 2: Wrap Your Application

```tsx
import { ArcUniversalAppKit } from "@arc/universal-app-kit";

function MyApp() {
  return (
    <ArcUniversalAppKit
      RELAYER_ADDRESS="0xdAF0182De86F904918Db8d07c7340A1EfcDF8244"
      ARC_EXECUTOR_ADDRESS="0x90Dfd581393104EAe03Fd349b4867A7E8F51313b"
      Application_deployed_address="0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD"
      ARC_GATEWAY_ADDRESS="0xD5Bb85Ee81342ea97A240b21156d33cb3a4Df985"
      Application_abi={ApplicationABI}
    >
      <YourApp/>
    </ArcUniversalAppKit>
  );
}
```

**That's it!** Your application is now accessible from any blockchain.

---

## 📋 What You Need

1. **Your Application Contract Address** (deployed on Arc Network)
2. **Your Application ABI** (from deployment artifacts or block explorer)
3. **Arc Infrastructure Addresses** (provided by Arc Network):
   - `RELAYER_ADDRESS`
   - `ARC_EXECUTOR_ADDRESS`
   - `ARC_GATEWAY_ADDRESS`

---

## 🔄 How It Works

```
User on Any Chain (Ethereum/Polygon/Solana/etc.)
         │
         │ 1. User triggers operation
         ▼
    ArcUniversalAppKit Wrapper
         │
         │ 2. Forwards intent to Gateway
         ▼
    Arc Gateway (Source Chain)
         │
         │ 3. Relayer picks up event
         ▼
    Arc Relayer (Off-Chain)
         │
         │ 4. Executes on Arc Network
         ▼
    Arc Executor (Arc Chain)
         │
         │ 5. Calls your application contract
         ▼
    Your Application (Arc Chain)
         │
         └─▶ Operation completed on Arc! ✅
```

**Key Points:**
- ✅ User stays on their preferred chain
- ✅ No network switching required
- ✅ No bridging needed
- ✅ All operations settle on Arc Network
- ✅ Your app logic remains unchanged

---

## 📝 Prerequisites

### 1. Deploy Your Contract on Arc Network

Your application contract must be deployed on **Arc Network**. This is where all operations will execute and state will be stored.

### 2. Get Your Contract ABI

Extract the ABI from your deployment artifacts:

```bash
# From Hardhat
cat artifacts/contracts/MyApp.sol/MyApp.json | jq .abi > MyApp.abi.json
```

Or copy it from:
- Your IDE/compiler output
- Arc block explorer

### 3. Get Arc Infrastructure Addresses

Contact Arc Network to get:
- `RELAYER_ADDRESS`
- `ARC_EXECUTOR_ADDRESS`
- `ARC_GATEWAY_ADDRESS`

---

## 💡 Example Usage

### Simple Example

```tsx
import { ArcUniversalAppKit } from "@arc/universal-app-kit";

// Your app's ABI
const MY_APP_ABI = [
  {
    inputs: [{ name: "_value", type: "uint256" }],
    name: "setValue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ... rest of your ABI
] as const;

function App() {
  return (
    <ArcUniversalAppKit
      RELAYER_ADDRESS="0xdAF0182De86F904918Db8d07c7340A1EfcDF8244"
      ARC_EXECUTOR_ADDRESS="0x90Dfd581393104EAe03Fd349b4867A7E8F51313b"
      Application_deployed_address="0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD"
      ARC_GATEWAY_ADDRESS="0xD5Bb85Ee81342ea97A240b21156d33cb3a4Df985"
      Application_abi={ApplicationABI}
    >
      <YourApp/>
    </ArcUniversalAppKit>
  );
}
```

---

## ⚠️ Troubleshooting

### "Wallet not connected"
Ensure the user has connected their wallet before using the component.

### "Wrong network"
Users can connect from any chain - the wrapper handles cross-chain communication automatically.

### "Function encoding failed"
Verify your ABI matches your deployed contract exactly. Check function names, parameter types, and order.

### "Intent not executing"
1. Verify your contract is deployed on Arc Network
2. Check all addresses are correct
3. Ensure relayer is running (contact Arc Network support)

---

## 🎉 That's It!

Your Arc-deployed application is now accessible from any blockchain. Users can interact with your app while staying on their preferred chain - no network switching or bridging required!
