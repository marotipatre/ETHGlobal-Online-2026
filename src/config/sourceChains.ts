import { arbitrumSepolia, baseSepolia, optimismSepolia, sepolia } from "viem/chains";
import { defineChain, type Chain } from "viem";
import { somniaTestnet } from "./chains";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "MonadVision", url: "https://testnet.monadvision.com" } },
  testnet: true,
});

export type SourceNetwork = {
  chain: Chain;
  gateway: `0x${string}` | null;
  rpcUrl: string;
};

const address = (value: string | undefined): `0x${string}` | null =>
  value && /^0x[a-fA-F0-9]{40}$/.test(value) ? value as `0x${string}` : null;

export const sourceNetworks: SourceNetwork[] = [
  { chain: somniaTestnet, gateway: address(process.env.NEXT_PUBLIC_SOMNIA_GATEWAY_ADDRESS || process.env.NEXT_PUBLIC_ARC_GATEWAY_ADDRESS), rpcUrl: process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || somniaTestnet.rpcUrls.default.http[0] },
  { chain: sepolia, gateway: address(process.env.NEXT_PUBLIC_SEPOLIA_GATEWAY_ADDRESS), rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || sepolia.rpcUrls.default.http[0] },
  { chain: baseSepolia, gateway: address(process.env.NEXT_PUBLIC_BASE_SEPOLIA_GATEWAY_ADDRESS), rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || baseSepolia.rpcUrls.default.http[0] },
  { chain: monadTestnet, gateway: address(process.env.NEXT_PUBLIC_MONAD_TESTNET_GATEWAY_ADDRESS), rpcUrl: process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL || monadTestnet.rpcUrls.default.http[0] },
  { chain: arbitrumSepolia, gateway: address(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_GATEWAY_ADDRESS), rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || arbitrumSepolia.rpcUrls.default.http[0] },
  { chain: optimismSepolia, gateway: address(process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_GATEWAY_ADDRESS), rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC_URL || optimismSepolia.rpcUrls.default.http[0] },
];

export const getSourceNetwork = (chainId: number) => sourceNetworks.find(({ chain }) => chain.id === chainId);
