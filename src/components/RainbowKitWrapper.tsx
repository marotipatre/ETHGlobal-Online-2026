"use client";

import { getDefaultWallets, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { somniaTestnet, arcTestnet } from "@/config/chains";
import { sourceNetworks } from "@/config/sourceChains";
import type { ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";

const { connectors } = getDefaultWallets({
  appName: "ArcFlow",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "367e7033f1d106ae8bdbbd60e7c478a9",
});

const config = createConfig({
  chains: [somniaTestnet, ...sourceNetworks.filter(({ chain }) => chain.id !== somniaTestnet.id).map(({ chain }) => chain), arcTestnet],
  connectors,
  transports: {
    [somniaTestnet.id]: http(process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://dream-rpc.somnia.network/"),
    [arcTestnet.id]: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network"),
    ...Object.fromEntries(sourceNetworks.filter(({ chain }) => chain.id !== somniaTestnet.id).map(({ chain, rpcUrl }) => [chain.id, http(rpcUrl)])),
  },
});

export function RainbowKitWrapper({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#c9ff3d",
          accentColorForeground: "#0b100c",
          borderRadius: "large",
          fontStack: "system",
          overlayBlur: "small",
        })}
        initialChain={somniaTestnet}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
