# ArcFlow developer guide

This repository is a Next.js application and an Arc intent relayer. It does not publish a standalone npm SDK package. The Counter and Todo pages are working examples of the integration.

## Supported testnets

- Somnia Testnet (source, chain ID 50312)
- Base Sepolia (source, chain ID 84532)
- Monad Testnet (source, chain ID 10143)
- Arc Testnet (execution destination, chain ID 5042002)

Sepolia, Arbitrum Sepolia, and OP Sepolia are listed as future source options. They stay disabled until a gateway is deployed and configured for both the UI and relayer.

## Current contract addresses

- Somnia ArcGateway: `0x96DBFD24b4d6aC9f0D00E9fFb59d7b76C3ae34af`
- Base Sepolia ArcGateway: `0xfC18C1Ae3ac3242ea7dB7839D396f51F8692F5EA`
- Monad Testnet ArcGateway: `0x039feAd52D2e8c818EdF837bef52D2Fd01aF7EeE`
- ArcExecutor: `0x91e2F7324d27F6714d3b7F72BD2cc055dc3CE82D`
- Arc Counter: `0x20371AD0921151682AEEA67C16db38144ebEaa8E`
- Arc Todo: `0x0c885d338123149493E16cFAd53969bC06B49722`

These are testnet deployments. Use your own environment variables if you redeploy.

## How an intent moves

1. The wallet connects to a configured source testnet.
2. Counter calls `ArcGateway.forwardIntent(counterAddress)`. Todo calls `ArcGateway.forwardIntentWithData(todoAddress, encodedCalldata)`.
3. The source transaction confirms and its hash enters the local direct queue.
4. The relayer verifies the gateway event and target, then calls ArcExecutor on Arc Testnet.
5. The relayer records detected, executing, completed, or failed status in the shared history file. The UI polls this history and reads the live Counter or Todo state from Arc.

The wallet must have gas on the chosen source chain. The authorized relayer must have Arc Testnet gas. No bridging is performed.

## Local setup

Copy `.env.example` to `.env.local`. Copy `web3-hardhat-intent/.env.example` to `web3-hardhat-intent/.env` and set `PRIVATE_KEY` privately. Install dependencies in both directories, then run `npm run dev` at the repository root. This starts the UI and relayer together. Use `npm run dev:ui` for an interface-only session.

The UI, direct queue, and relayer currently share one filesystem. A hosted deployment with separate processes needs a durable shared queue and history store. Static files on a serverless host are not a substitute for that store.

## Reusing the patterns

Use `src/config/sourceChains.ts` for source networks and gateway addresses, `src/lib/contracts.ts` for Arc target addresses and ABIs, and `src/hooks/IntentFlowContext.tsx` for submission and progress tracking. The relayer allowlists Counter and Todo targets in `web3-hardhat-intent/relayer/index.ts`. An additional target requires matching ABI, UI submission, and a deliberate relayer allowlist update.

## Troubleshooting

- If a wallet signs but Arc state does not change, confirm the UI and relayer use the same source gateway and Arc target addresses.
- If the progress panel says the relayer is offline, start `npm run dev` or `npm run relayer` and check its output.
- If the source transaction succeeded but execution failed, inspect the linked source and Arc transactions and the relayer history error.
- If a network is disabled, deploy ArcGateway there, set its gateway and start-block variables in both environments, and restart the app and relayer.
