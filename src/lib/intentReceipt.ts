import { decodeEventLog, type TransactionReceipt } from "viem";
import { ARC_GATEWAY_ABI } from "./contracts";

export function isConfirmedGatewayIntent(
  receipt: Pick<TransactionReceipt, "status" | "logs">,
  gateway: `0x${string}`,
): boolean {
  if (receipt.status !== "success") return false;
  // Wallets and routers can call the gateway internally. The authenticated log
  // emitter, rather than the top-level transaction recipient, identifies it.
  return receipt.logs.some((log) => {
    if (log.address.toLowerCase() !== gateway.toLowerCase()) return false;
    try {
      const event = decodeEventLog({ abi: ARC_GATEWAY_ABI, data: log.data, topics: log.topics });
      return event.eventName === "IntentForwarded" || event.eventName === "IntentForwardedWithData";
    } catch {
      return false;
    }
  });
}
