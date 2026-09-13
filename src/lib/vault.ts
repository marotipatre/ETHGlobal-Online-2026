import { parseAbi } from "viem";

export const ARC_USDC_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
]);

export const VAULT_ABI = parseAbi([
  "function usdc() view returns (address)",
  "function executor() view returns (address)",
  "function paused() view returns (bool)",
  "function pending(address) view returns (uint256)",
  "function shares(address) view returns (uint256)",
  "function claimable(address) view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function totalPending() view returns (uint256)",
  "function yieldReserve() view returns (uint256)",
  "function backing() view returns (uint256 balance,uint256 liabilities)",
  "function fundFor(address,uint256)",
  "function reclaimPending(uint256)",
  "function depositFor(address,uint256)",
  "function withdrawFor(address,uint256)",
  "function harvestFor(address)",
]);
