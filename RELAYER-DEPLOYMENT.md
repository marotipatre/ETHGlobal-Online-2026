# Deploy the relayer and health fixes

These changes update the Vercel API and Railway worker. No contract deployment is required.

## Recover the September 14 stuck deposit

Source transaction `0x87374f13b56d987a8c8fe66739bd6ff45c4ae8ffe2671e99a6abd5baf8d5e431` emitted the configured Base Sepolia gateway event through a wallet/router. The API previously rejected it because the top-level transaction recipient was not the gateway. The updated API validates the successful receipt and the gateway's event emitter, allowing this call path.

This deposit already succeeded on Arc in `0xdcb8d208496e0f02f0240c2d8f7dc06ca7d656ffa0b4b6d384c4fda7591a4402`. A later duplicate attempt, `0xb3cc78f6fff337b625cd445df0e135ef8270fb7ca377be6d2cbf0f7120c78894`, emitted an unsuccessful execution. Local history contains the first success while the hosted history contains the later failure. Do not resubmit the deposit.

The recovery command verifies the source gateway event, the destination executor address, matching user/target/calldata, and both the successful executor and vault deposit events. It never constructs a wallet or broadcasts a transaction. It only updates the one history entry when explicitly run with `--apply`, and first backs up the existing Redis history. This repairs status reporting; it does not undo earlier duplicate executions.

1. Stop the Railway relayer deployment before recovery, and keep the local relayer stopped. Use `npm run dev:ui` for local UI work; `npm run dev` currently starts a local relayer too.
2. In your local **private** `web3-hardhat-intent/.env`, set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the same existing database used by Railway/Vercel. Do not paste the token into chat or commit it. Keep the existing contract addresses. No private key is needed by the recovery command.
3. From the repository root, preview the verified record:

   ```bash
   npm --prefix web3-hardhat-intent run reconcile:deposit -- 84532 0x87374f13b56d987a8c8fe66739bd6ff45c4ae8ffe2671e99a6abd5baf8d5e431 0xdcb8d208496e0f02f0240c2d8f7dc06ca7d656ffa0b4b6d384c4fda7591a4402
   ```

4. With both relayers stopped, apply that record:

   ```bash
   npm --prefix web3-hardhat-intent run reconcile:deposit -- 84532 0x87374f13b56d987a8c8fe66739bd6ff45c4ae8ffe2671e99a6abd5baf8d5e431 0xdcb8d208496e0f02f0240c2d8f7dc06ca7d656ffa0b4b6d384c4fda7591a4402 --apply --relayer-stopped
   ```

5. Commit and push the API fix and recovery tooling (leave `public/intent-history.json` and `.env` out):

   ```bash
   git add RELAYER-DEPLOYMENT.md src/app/api/intents/route.ts src/lib/intentReceipt.ts src/hooks/IntentFlowContext.tsx src/components/IntentProgress.tsx web3-hardhat-intent/package.json web3-hardhat-intent/relayer/relayer.test.ts web3-hardhat-intent/scripts/reconcile-deposit.ts
   git commit -m "Accept wallet-routed intents and add verified deposit status recovery"
   git push origin main
   ```

6. Deploy the new commit to Vercel and restart only Railway, which reloads the repaired shared history. Refresh `/api/intents`: this source hash should show `completed` with execution hash `0xdcb8d208496e0f02f0240c2d8f7dc06ca7d656ffa0b4b6d384c4fda7591a4402`. Then refresh the vault page; the completed history record advances the progress panel.

The other old failed entries need their own receipt verification if you want their history reconciled; this command changes only the specified deposit.

## What changed

- Both services use the same Upstash command format and read legacy double-encoded JSON.
- Queue writes are acknowledged by Redis, and the worker removes an entry only after handling its confirmed receipt.
- Railway restores intent history and checkpoints from Redis, and waits for history writes before broadcasting. Redis failures stop execution instead of silently using stale local state.
- A heartbeat runs every five seconds independently of backfills. Its `sources` list includes only networks successfully polled within the last 30 seconds. Backfills yield after five chunks per network.
- The UI clears its online state when health/history requests fail.

## Deploy in this order

1. Keep the existing Upstash database and its `intent-history`, `relayer-checkpoints`, and `intent-queue:*` keys. Do not reset history or start blocks to retry old transactions. Past deployments may already have executed the same source transaction more than once.
2. In Railway, open the current relayer deployment's three-dot menu and choose **Remove** to stop that deployment. Keep the service and database. Wait for the deployment to stop before starting the replacement; use one replica. Stop any local relayer using the same configuration too. Railway normally overlaps deployments, so one replica alone does not prevent overlap during updates. [Railway deployment actions](https://docs.railway.com/deployments/deployment-actions), [deployment teardown](https://docs.railway.com/deployments/deployment-teardown).
3. Verify the following server-side variables in both Railway and Vercel's **Production** environment. They must point to the same existing database:

   ```text
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

   Use a token that permits queue writes. Keep the names without a `NEXT_PUBLIC_` prefix. Keep your existing Railway `PRIVATE_KEY` and working RPC variables. Confirm Railway `VAULT_ADDRESS` matches Vercel `NEXT_PUBLIC_VAULT_ADDRESS` (currently `0x6CEB9E7404ea63D102Fa3dEc736be16a439bD7DB`), and likewise check `TODO_ADDRESS` / `NEXT_PUBLIC_TODO_ADDRESS` and `COUNTER_ADDRESS` / `NEXT_PUBLIC_COUNTER_ADDRESS`.

4. From the repository root, commit only these changes and push:

   ```bash
   git add RELAYER-DEPLOYMENT.md src/app/api/intents/route.ts src/app/api/relayer-health/route.ts src/hooks/IntentFlowContext.tsx web3-hardhat-intent/package.json web3-hardhat-intent/relayer/index.ts web3-hardhat-intent/relayer/redis.ts web3-hardhat-intent/relayer/relayer.test.ts
   git commit -m "Fix relayer shared state, queue encoding, and health reporting"
   git push origin main
   ```

   The chat export and private env files are not included in this command.

5. Confirm **both Vercel and Railway deploy this new commit**. If automatic deployment does not trigger, deploy the latest commit manually. In Railway use **Deploy Latest Commit**; redeploying an old deployment uses that old deployment's code. Retain the working Railway root directory (`web3-hardhat-intent`) and start command (`npm run relayer`). Vercel should build from the repository root. Vercel environment changes apply to a new deployment. [Railway actions](https://docs.railway.com/deployments/deployment-actions), [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Verify before sending another intent

Open [relayer health](https://eth-global-online-2026.vercel.app/api/relayer-health). The response should be an object starting with `{`, with no outer quotes. Refresh after 5–10 seconds: `updatedAt` must advance. After the networks have been polled, `sources` should include `50312`, `84532`, and `10143`. An empty or partial list means those networks have not polled successfully recently; inspect Railway's RPC/heartbeat errors.

Open [intent history](https://eth-global-online-2026.vercel.app/api/intents). It should be an array starting with `[`. Railway should log `Restored N intent(s) from shared state` and resume using stored checkpoints once created. It should not broadcast a new execution for source transactions already marked completed or failed.

Refresh the vault page, connect the same wallet, and switch to Somnia, Base Sepolia, or Monad. Submit one new small intent appropriate to the displayed balance:

- **Deposit:** needs pending funding on Arc.
- **Withdraw:** needs deposited shares. Funding a pending balance does not create shares until the deposit intent completes.
- **Reclaim pending:** returns funding that has not yet been deposited, directly on Arc.
- **Harvest:** needs actual funded, claimable yield.

The historical `Data intent targets an unapproved contract` entry refers to a target outside the worker's current Todo/vault allowlist. Do not broaden that allowlist simply to retry an old transaction. `ArcExecutor emitted an unsuccessful execution` means the target call failed; the event alone does not identify its exact revert reason.

## Restart limits

The current deployed executor does not enforce unique source-intent IDs on-chain. Durable history prevents recorded terminal intents from replaying in this single-worker setup, but it cannot repair duplicates already broadcast or support concurrent workers. An interrupted execution with no saved Arc hash is held as failed with a reconciliation message, rather than automatically retried. Check Arc execution history before taking further action on such a record. Retain Redis history across future deployments and avoid overlapping relayers.

## Local checks

These commands use mocked Redis/RPC fixtures for the regression tests; they do not start the relayer or send transactions:

```bash
npm --prefix web3-hardhat-intent run test:relayer
npx tsc --noEmit
npm run build
```
