"use client";

import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { somniaTestnet } from "@/config/chains";

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const wallet = {
    address: address || null,
    isConnected,
    chainId,
    isOnSomnia: chainId === somniaTestnet.id,
  };

  return {
    wallet,
    connect: () => {
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      }
    },
    disconnect,
    isConnecting,
  };
}
