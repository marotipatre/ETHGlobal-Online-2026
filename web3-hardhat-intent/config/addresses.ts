/**
 * Contract Addresses Configuration
 * 
 * This file stores all deployed contract addresses for easy reference.
 * Addresses are loaded from environment variables with fallback defaults.
 */

export const CONTRACT_ADDRESSES = {
  // Counter Contract (Arc Chain)
  COUNTER: process.env.COUNTER_ADDRESS || "",
  
  // Todo Contract (Arc Chain)
  TODO: process.env.TODO_ADDRESS || "",
  
  // Arc Executor (Arc Chain)
  ARC_EXECUTOR: process.env.ARC_EXECUTOR_ADDRESS || "",
  
  ARC_GATEWAY: process.env.ARC_GATEWAY_ADDRESS || "",
} as const;

/**
 * Validate that required addresses are set
 */
export function validateAddresses() {
  const missing: string[] = [];
  
  if (!CONTRACT_ADDRESSES.COUNTER) missing.push("COUNTER_ADDRESS");
  if (!CONTRACT_ADDRESSES.TODO) missing.push("TODO_ADDRESS");
  if (!CONTRACT_ADDRESSES.ARC_EXECUTOR) missing.push("ARC_EXECUTOR_ADDRESS");
  if (!CONTRACT_ADDRESSES.ARC_GATEWAY) missing.push("ARC_GATEWAY_ADDRESS");
  
  if (missing.length > 0) {
    console.warn("⚠️  Missing contract addresses in .env:", missing.join(", "));
  }
  
  return missing.length === 0;
}
