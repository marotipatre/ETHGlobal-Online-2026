# ArcFlow USDC Vault — hackathon demo

The deployed Arc Testnet vault is `0x6CEB9E7404ea63D102Fa3dEc736be16a439bD7DB`. It uses Circle's Arc Testnet USDC at `0x3600000000000000000000000000000000000000`. All balances in this guide are **test tokens with no cash value**.

## What the demo proves

1. A wallet funds a pending USDC balance **on Arc** with `approve` then `fundFor` (or a sponsor can call `fundFor` for that address).
2. The wallet switches to Somnia Testnet, Base Sepolia, or Monad Testnet and signs `ArcGateway.forwardIntentWithData`.
3. The relayer validates the source event, approved vault method, and matching source user; it then asks ArcExecutor to call the vault.
4. The vault converts pending USDC to 1:1 shares (`depositFor`), pays principal back to the user's Arc address (`withdrawFor`), or pays separately funded yield (`harvestFor`).
5. The UI shows source and Arc transaction hashes, intent status, wallet/pending/share/claimable balances, and `backing()` versus liabilities.

This is **not a cross-chain USDC transfer**. No source asset is locked, burned, or bridged by ArcFlow. Withdrawals are Arc-side only; if the desired payout chain lacks liquidity, users need a separate supported bridge/off-ramp. No APY or investment strategy is claimed. The owner can contribute test USDC through `fundYield`; if there is no funded yield, harvest is disabled. Reward math rounds down at USDC's six-decimal precision, potentially leaving a micro-unit of reserve dust.

## Live walkthrough

1. Start the local UI and relayer with `npm run dev` from the repository root, then open `http://localhost:3000/vault`.
2. Connect a funded EVM wallet. If needed, obtain Arc Testnet USDC from the [Circle faucet](https://faucet.circle.com/). The wallet needs Arc gas and source-network gas as well.
3. Enter `1.00` USDC and click **Approve & fund**. The wallet switches to Arc, approves exactly that amount, and funds its pending balance. The vault's backing and pending cards update after confirmation.
4. Choose a configured source network and click **Deposit with cross-chain intent**. Watch the source confirmation, relayer, and Arc stages. Shares increase one-for-one.
5. Choose **Withdraw**, enter a smaller amount, and sign from a source network. Arc USDC returns to the same wallet address on Arc.
6. If the owner has funded yield, choose **Harvest**; otherwise the button stays disabled and the UI says why.
7. Open **Basic Testing** for Counter/Todo regression demos.

The deployer test account currently has a demonstration position of 1.5 USDC shares and approximately 0.25 test USDC claimable yield. New visitors do not inherit that position; they must fund their own pending balance, or a sponsor must fund for their address.

## Operations

Copy the two `.env.example` files to `.env.local` and `web3-hardhat-intent/.env`, respectively; put the funded, authorized relayer private key only in the ignored Hardhat env file. The current vault and source gateway addresses are already in the examples. `npm run dev` starts both Next and the relayer on the same machine. The direct queue, checkpoint, health, and history files are local; independent/serverless hosts require a shared durable store and stronger operational controls.

```bash
cd web3-hardhat-intent
npm test
npx ts-node scripts/smoke-vault.ts --verify
```

The `smoke-vault.ts` default mode sends **real testnet transactions** and spends approximately 2.35 Arc test USDC plus testnet gas, so use it intentionally. The `--verify` mode is read-only. To redeploy, run `npm run deploy:vault`, update `VAULT_ADDRESS` and `NEXT_PUBLIC_VAULT_ADDRESS`, then restart the app and relayer.

## Trust and safety boundary

The source gateway emits an event but does not verify remote execution. The relayer is a trusted service holding an Arc-authorized key. It allowlists Counter, Todo, and three vault methods and checks that the vault calldata names the source signer. ArcExecutor itself accepts calls from authorized relayers and does **not** verify cross-chain proofs. This architecture is suitable for a transparent testnet hackathon demo, **not for unattended production custody or real funds**. A production version would need authenticated cross-chain proofs, audited contracts, key management, rate limiting, durable queues, monitoring, and an explicit liquidity/bridging design.
