# 🎨 System Architecture Diagrams

## 📐 High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                        Cross-Chain Intent System                      │
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
│              │     Event     │              │ execute()│              │
└──────────────┘               └──────────────┘         └──────────────┘

Event:                         Listens &                 Executes:
IntentForwarded()             Processes                  - Verifies relayer
                                                        - Calls target
                                                        - Emits result
```

## 🔄 Transaction Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Transaction Flow Timeline                        │
└─────────────────────────────────────────────────────────────────────────┘

T0: User initiates intent on Source Chain
    │
    ├─▶ User calls: gateway.forwardIntent(counterAddress)
    │   - Tx sent to source chain
    │   - Nonce incremented: nonces[user]++
    │
T1: Transaction confirmed on Source Chain
    │
    ├─▶ Event emitted: IntentForwarded(user, target, nonce, timestamp)
    │   - Recorded in blockchain logs
    │   - Gas cost: ~50k gas
    │
T2: Relayer detects event (polling interval: ~5 sec)
    │
    ├─▶ Relayer queries: gateway.queryFilter(IntentForwarded)
    │   - Reads event data from logs
    │   - Extracts: user, target, nonce
    │
T3: Relayer prepares execution on Arc
    │
    ├─▶ Relayer checks: executor.authorizedRelayers(relayer)
    │   - Verify relayer has permission
    │   - If not authorized: ABORT
    │
T4: Relayer executes on Arc Chain
    │
    ├─▶ Relayer calls: executor.execute(user, target)
    │   - Tx sent to Arc Chain
    │   - Relayer pays gas on Arc
    │
T5: Executor processes intent
    │
    ├─▶ Executor calls: Counter(target).increment()
    │   - try-catch wrapper for safety
    │   - State change: count++
    │
T6: Result emitted on Arc Chain
    │
    └─▶ Event emitted: IntentExecuted(user, target, success)
        - Confirmation of execution
        - Gas cost: ~70k gas

Total Time: T0 → T6 = ~10-30 seconds (depending on block times + polling)
```

## 🏗️ Contract Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    Contract Interactions                         │
└──────────────────────────────────────────────────────────────────┘

SOURCE CHAIN CONTRACTS                 ARC CHAIN CONTRACTS
─────────────────────                 ───────────────────

┌─────────────────────┐              ┌─────────────────────┐
│    ArcGateway       │              │   ArcExecutor       │
├─────────────────────┤              ├─────────────────────┤
│                     │              │                     │
│ State:              │              │ State:              │
│ • nonces[]          │              │ • owner             │
│                     │              │ • authorizedRelayers│
│ Functions:          │              │ • universalAccounts │
│ ✓ forwardIntent()   │              │                     │
│ ✓ forwardIntent     │              │ Functions:          │
│   WithData()        │              │ ✓ execute()         │
│ ✓ getNonce()        │              │ ✓ executeWithData() │
│                     │              │ ✓ setRelayer        │
│ Events:             │              │   Authorization()   │
│ • IntentForwarded   │              │                     │
│ • IntentForwarded   │              │ Events:             │
│   WithData          │              │ • IntentExecuted    │
│                     │              │ • RelayerAuthorized │
└─────────────────────┘              └──────────┬──────────┘
                                               │
                                               │ calls
                                               ▼
                                    ┌─────────────────────┐
                                    │     Counter         │
                                    ├─────────────────────┤
                                    │                     │
                                    │ State:              │
                                    │ • count             │
                                    │                     │
                                    │ Functions:          │
                                    │ ✓ increment()       │
                                    │ ✓ getCount()        │
                                    │                     │
                                    │ Events:             │
                                    │ • Incremented       │
                                    └─────────────────────┘
```

## 🔐 Access Control Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    Access Control Matrix                    │
└────────────────────────────────────────────────────────────┘

ArcExecutor Contract:

┌────────────────┬──────────────┬─────────────┬──────────────┐
│    Function    │     User     │  Relayer    │    Owner     │
├────────────────┼──────────────┼─────────────┼──────────────┤
│ execute()      │      ✗       │      ✓      │      ✓       │
├────────────────┼──────────────┼─────────────┼──────────────┤
│ executeWith    │      ✗       │      ✓      │      ✓       │
│ Data()         │              │             │              │
├────────────────┼──────────────┼─────────────┼──────────────┤
│ setRelayer     │      ✗       │      ✗      │      ✓       │
│ Authorization()│              │             │              │
└────────────────┴──────────────┴─────────────┴──────────────┘

ArcGateway Contract:

┌────────────────┬──────────────┬─────────────┬──────────────┐
│    Function    │     User     │  Relayer    │    Owner     │
├────────────────┼──────────────┼─────────────┼──────────────┤
│ forwardIntent()│      ✓       │      ✓      │      ✓       │
├────────────────┼──────────────┼─────────────┼──────────────┤
│ forwardIntent  │      ✓       │      ✓      │      ✓       │
│ WithData()     │              │             │              │
├────────────────┼──────────────┼─────────────┼──────────────┤
│ getNonce()     │      ✓       │      ✓      │      ✓       │
│     (view)     │              │             │              │
└────────────────┴──────────────┴─────────────┴──────────────┘

Counter Contract:

┌────────────────┬──────────────┬─────────────┬──────────────┐
│    Function    │     User     │  Executor   │    Owner     │
├────────────────┼──────────────┼─────────────┼──────────────┤
│ increment()    │      ✓       │      ✓      │      ✓       │
├────────────────┼──────────────┼─────────────┼──────────────┤
│ getCount()     │      ✓       │      ✓      │      ✓       │
│     (view)     │              │             │              │
└────────────────┴──────────────┴─────────────┴──────────────┘

✓ = Allowed    ✗ = Denied
```

## 📊 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Data Flow                                │
└──────────────────────────────────────────────────────────────────┘

1. INTENT CREATION (Source Chain)
   ─────────────────────────────
   
   User Input:
   ┌───────────────────────┐
   │ target: 0x1234...     │
   │ (Counter address)     │
   └───────────┬───────────┘
               │
               ▼
   ArcGateway Processing:
   ┌───────────────────────┐
   │ user = msg.sender     │
   │ nonce = nonces[user]++│
   │ timestamp = block.ts  │
   └───────────┬───────────┘
               │
               ▼
   Event Emission:
   ┌───────────────────────────────┐
   │ IntentForwarded(              │
   │   user: 0xAbC...,             │
   │   target: 0x123...,           │
   │   nonce: 5,                   │
   │   timestamp: 1706745600       │
   │ )                             │
   └───────────────────────────────┘

2. RELAYER PROCESSING (Off-Chain)
   ──────────────────────────────
   
   Event Reading:
   ┌───────────────────────┐
   │ Query blockchain logs │
   │ Filter: IntentForwarded│
   │ Blocks: last → current│
   └───────────┬───────────┘
               │
               ▼
   Data Extraction:
   ┌───────────────────────┐
   │ user: 0xAbC...        │
   │ target: 0x123...      │
   │ nonce: 5              │
   │ timestamp: 1706745600 │
   └───────────┬───────────┘
               │
               ▼
   Transaction Preparation:
   ┌───────────────────────┐
   │ to: ArcExecutor       │
   │ data: execute(        │
   │   user, target        │
   │ )                     │
   └───────────────────────┘

3. INTENT EXECUTION (Arc Chain)
   ────────────────────────────
   
   Authorization Check:
   ┌───────────────────────┐
   │ msg.sender == relayer?│
   │ authorizedRelayers[   │
   │   msg.sender          │
   │ ] == true?            │
   └───────────┬───────────┘
               │
               ▼
   Target Execution:
   ┌───────────────────────┐
   │ try {                 │
   │   Counter(target)     │
   │     .increment()      │
   │ } catch {             │
   │   success = false     │
   │ }                     │
   └───────────┬───────────┘
               │
               ▼
   Result Emission:
   ┌───────────────────────┐
   │ IntentExecuted(       │
   │   user: 0xAbC...,     │
   │   target: 0x123...,   │
   │   success: true       │
   │ )                     │
   └───────────────────────┘

4. STATE CHANGES
   ─────────────
   
   Source Chain:
   ┌───────────────────────┐
   │ nonces[user] = 6      │
   └───────────────────────┘
   
   Arc Chain:
   ┌───────────────────────┐
   │ counter.count = 42    │
   │ (incremented from 41) │
   └───────────────────────┘
```

## 🎯 Component Responsibilities

```
┌──────────────────────────────────────────────────────────────┐
│               Component Responsibility Matrix                │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┬─────────────────────────────────────────────┐
│   Component     │            Responsibilities                 │
├─────────────────┼─────────────────────────────────────────────┤
│  ArcGateway     │ • Accept user intents                       │
│  (Source)       │ • Emit events (no state)                    │
│                 │ • Track nonces                              │
│                 │ • Provide replay protection                 │
├─────────────────┼─────────────────────────────────────────────┤
│  Relayer        │ • Monitor source chain events               │
│  (Off-Chain)    │ • Parse event data                          │
│                 │ • Submit txs to Arc Chain                   │
│                 │ • Handle errors & retries                   │
│                 │ • Log operations                            │
├─────────────────┼─────────────────────────────────────────────┤
│  ArcExecutor    │ • Verify relayer authorization              │
│  (Arc)          │ • Execute intents safely                    │
│                 │ • Manage relayer access                     │
│                 │ • Emit execution results                    │
│                 │ • Handle execution failures                 │
├─────────────────┼─────────────────────────────────────────────┤
│  Counter        │ • Implement app logic                       │
│  (Arc)          │ • Maintain state (count)                    │
│                 │ • Process increment calls                   │
│                 │ • Emit state changes                        │
└─────────────────┴─────────────────────────────────────────────┘
```

## 🚦 State Transition Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  Intent State Transitions                     │
└──────────────────────────────────────────────────────────────┘

    START
      │
      ▼
┌──────────┐
│  PENDING │  ◀── Intent created on source chain
└────┬─────┘      User signs transaction
     │
     │ Event emitted
     │
     ▼
┌──────────┐
│ DETECTED │  ◀── Relayer sees event in logs
└────┬─────┘      Querying blockchain events
     │
     │ Relayer processes
     │
     ▼
┌──────────┐
│SUBMITTING│  ◀── Relayer sends tx to Arc
└────┬─────┘      Transaction in mempool
     │
     │ Tx confirmed
     │
     ▼
┌──────────┐
│EXECUTING │  ◀── ArcExecutor processes
└────┬─────┘      Calling target contract
     │
     ├──────────────┬──────────────┐
     │              │              │
   Success        Failure      Invalid
     │              │              │
     ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│COMPLETED │  │  FAILED  │  │ REJECTED │
└──────────┘  └──────────┘  └──────────┘
     │              │              │
     │              │              │
     └──────────────┴──────────────┘
                    │
                    ▼
                   END

States:
- PENDING: Intent forwarded, waiting for relayer
- DETECTED: Relayer found event, preparing execution
- SUBMITTING: Transaction sent to Arc Chain
- EXECUTING: ArcExecutor processing the intent
- COMPLETED: Successfully executed ✓
- FAILED: Execution failed but handled gracefully
- REJECTED: Authorization or validation failed
```

---

**Visual Guide Complete** 🎨
*All system components, flows, and interactions documented!*
