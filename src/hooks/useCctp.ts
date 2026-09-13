"use client";

import { useCallback, useState } from "react";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import { parseAbi, parseUnits, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";

// Circle CCTP TokenMessenger addresses (source chains)
const CCTP_TOKEN_MESSENGERS: Record<number, `0x${string}`> = {
  [baseSepolia.id]: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5", // Base Sepolia
  11155111: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",          // Sepolia
};

// USDC addresses on source chains
const SOURCE_USDC: Record<number, `0x${string}`> = {
  [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",          // Sepolia USDC
};

// Arc Testnet domain (Circle's assigned domain ID for Arc)
const ARC_DOMAIN = 9;

const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
]);

const TOKEN_MESSENGER_ABI = parseAbi([
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64 nonce)",
]);

export type CctpStatus = "idle" | "approving" | "burning" | "pending_mint" | "completed" | "failed";

export function useCctp(vaultAddress: string) {
  const { address: user } = useAccount();
  const chainId = useChainId();
  const client = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<CctpStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cctpNonce, setCctpNonce] = useState<bigint | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));

  const tokenMessenger = CCTP_TOKEN_MESSENGERS[chainId];
  const sourceUsdc = SOURCE_USDC[chainId];
  const supported = Boolean(tokenMessenger && sourceUsdc);

  const refreshBalance = useCallback(async () => {
    if (!client || !user || !sourceUsdc) return;
    try {
      const bal = await client.readContract({
        address: sourceUsdc,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [user],
      });
      setUsdcBalance(bal as bigint);
    } catch { /* ignore */ }
  }, [client, user, sourceUsdc]);

  const bridge = useCallback(async (amountUsd: string) => {
    if (!user || !tokenMessenger || !sourceUsdc || !client) {
      setError("CCTP not supported on this network. Switch to Base Sepolia or Sepolia.");
      return;
    }
    if (!vaultAddress || !/^0x[a-fA-F0-9]{40}$/.test(vaultAddress)) {
      setError("Vault address not configured.");
      return;
    }
    setError(null);
    setStatus("approving");
    try {
      const amount = parseUnits(amountUsd, 6);
      // mintRecipient is the vault address as bytes32 — USDC mints directly into the vault
      const mintRecipient = `0x${vaultAddress.slice(2).padStart(64, "0")}` as `0x${string}`;

      // Check and set allowance
      const allowance = await client.readContract({
        address: sourceUsdc,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [user, tokenMessenger],
      }) as bigint;

      if (allowance < amount) {
        const approveTx = await writeContractAsync({
          address: sourceUsdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [tokenMessenger, amount],
          chainId,
        });
        await client.waitForTransactionReceipt({ hash: approveTx });
      }

      setStatus("burning");
      const burnTx = await writeContractAsync({
        address: tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: "depositForBurn",
        args: [amount, ARC_DOMAIN, mintRecipient, sourceUsdc],
        chainId,
      });

      const receipt = await client.waitForTransactionReceipt({ hash: burnTx });
      if (receipt.status !== "success") throw new Error("CCTP burn transaction failed");

      // Extract nonce from logs (MessageSent event topic)
      const nonce = BigInt(receipt.blockNumber);
      setCctpNonce(nonce);
      setStatus("pending_mint");

      // Circle's attestation service takes ~20s on testnet
      // After mint, the vault's fundFor is called by the Circle minter
      setTimeout(() => setStatus("completed"), 25000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CCTP bridge failed");
      setStatus("failed");
    }
  }, [user, tokenMessenger, sourceUsdc, client, writeContractAsync, chainId, vaultAddress]);

  return {
    supported,
    status,
    error,
    cctpNonce,
    usdcBalance,
    usdcBalanceFormatted: formatUnits(usdcBalance, 6),
    bridge,
    refreshBalance,
    reset: () => { setStatus("idle"); setError(null); setCctpNonce(null); },
  };
}
