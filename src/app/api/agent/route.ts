import { createPublicClient, createWalletClient, encodeFunctionData, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/config/chains";

export const dynamic = "force-dynamic";

const VAULT_ABI = parseAbi([
  "function claimable(address user) view returns (uint256)",
  "function shares(address user) view returns (uint256)",
  "function paused() view returns (bool)",
  "function harvestFor(address user)",
]);

const EXECUTOR_ABI = parseAbi([
  "function executeWithData(address user, address target, bytes data)",
  "function authorizedRelayers(address) view returns (bool)",
]);

// Agent decision threshold — only harvest if claimable > $0.01 USDC
const HARVEST_THRESHOLD = BigInt(10_000); // 0.01 USDC (6 decimals)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get("user");
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
  const executorAddress = process.env.NEXT_PUBLIC_ARC_EXECUTOR_ADDRESS;

  if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
    return Response.json({ error: "Invalid user address" }, { status: 400 });
  }
  if (!vaultAddress || !executorAddress) {
    return Response.json({ error: "Vault or executor not configured" }, { status: 503 });
  }

  const arc = createPublicClient({ chain: arcTestnet, transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network") });

  try {
    const [claimable, shares, paused] = await Promise.all([
      arc.readContract({ address: vaultAddress as `0x${string}`, abi: VAULT_ABI, functionName: "claimable", args: [userAddress as `0x${string}`] }),
      arc.readContract({ address: vaultAddress as `0x${string}`, abi: VAULT_ABI, functionName: "shares", args: [userAddress as `0x${string}`] }),
      arc.readContract({ address: vaultAddress as `0x${string}`, abi: VAULT_ABI, functionName: "paused" }),
    ]);

    const decision = {
      user: userAddress,
      claimable: claimable.toString(),
      shares: shares.toString(),
      paused,
      threshold: HARVEST_THRESHOLD.toString(),
      shouldHarvest: !paused && claimable >= HARVEST_THRESHOLD,
      reason: paused ? "vault_paused" : claimable < HARVEST_THRESHOLD ? "below_threshold" : "harvest_ready",
    };

    // If agent has a private key configured, execute autonomously
    const agentKey = process.env.AGENT_PRIVATE_KEY;
    if (decision.shouldHarvest && agentKey) {
      try {
        const account = privateKeyToAccount(agentKey as `0x${string}`);
        const wallet = createWalletClient({ account, chain: arcTestnet, transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network") });

        // Check if agent is authorized as relayer
        const isAuthorized = await arc.readContract({
          address: executorAddress as `0x${string}`,
          abi: EXECUTOR_ABI,
          functionName: "authorizedRelayers",
          args: [account.address],
        });

        if (isAuthorized) {
          const data = encodeFunctionData({ abi: VAULT_ABI, functionName: "harvestFor", args: [userAddress as `0x${string}`] });
          const hash = await wallet.writeContract({
            address: executorAddress as `0x${string}`,
            abi: EXECUTOR_ABI,
            functionName: "executeWithData",
            args: [userAddress as `0x${string}`, vaultAddress as `0x${string}`, data],
            gas: BigInt(300_000),
          });
          return Response.json({ ...decision, agentExecuted: true, executionHash: hash });
        }
      } catch (execError) {
        return Response.json({ ...decision, agentExecuted: false, agentError: execError instanceof Error ? execError.message : "Agent execution failed" });
      }
    }

    return Response.json({ ...decision, agentExecuted: false });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Agent check failed" }, { status: 500 });
  }
}
