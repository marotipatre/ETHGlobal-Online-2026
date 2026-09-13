"use client";

import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { somniaTestnet } from "@/config/chains";
import { getSourceNetwork } from "@/config/sourceChains";

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
    isOnSupportedSource: Boolean(getSourceNetwork(chainId)?.gateway),
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
