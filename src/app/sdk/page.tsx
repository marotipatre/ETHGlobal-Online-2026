import { ArrowRight, ExternalLink, Code2, Zap, Bot, GitBranch, Shield } from "lucide-react";
import Link from "next/link";

const circleStack = [
  {
    name: "Arc Testnet",
    tag: "DESTINATION CHAIN",
    color: "text-[var(--primary)]",
    border: "border-[var(--primary)]/30",
    desc: "Circle's purpose-built EVM-compatible L1. ArcExecutor and StablecoinVault are deployed here. All USDC vault state lives on Arc.",
    link: "https://developers.circle.com/arc",
    code: "chainId: 5042002\nrpc: https://rpc.testnet.arc.network",
  },
  {
    name: "Arc USDC",
    tag: "NATIVE STABLECOIN",
    color: "text-[var(--primary)]",
    border: "border-[var(--primary)]/30",
    desc: "Native USDC on Arc Testnet. The StablecoinVault holds, distributes, and tracks USDC balances. 1:1 backed principal enforced on-chain.",
    link: "https://developers.circle.com/stablecoins/usdc-on-arc",
    code: "address: 0x3600000000000000000000000000000000000000",
  },
  {
    name: "Circle CCTP",
    tag: "CROSS-CHAIN TRANSFER",
    color: "text-blue-300",
    border: "border-blue-300/30",
    desc: "Circle's Cross-Chain Transfer Protocol. Burns USDC on Base Sepolia via TokenMessenger and mints natively on Arc — no wrapped tokens, no liquidity pools.",
    link: "https://developers.circle.com/stablecoins/cctp-getting-started",
    code: "TokenMessenger.depositForBurn(\n  amount, ARC_DOMAIN=9,\n  mintRecipient, burnToken\n)",
  },
  {
    name: "Circle Paymaster",
    tag: "GAS ABSTRACTION",
    color: "text-[var(--tertiary)]",
    border: "border-[var(--tertiary)]/30",
    desc: "EIP-4337 Paymaster sponsoring gas for Arc execution. When PAYMASTER_URL is set, the relayer requests gas sponsorship so users never need native Arc tokens.",
    link: "https://developers.circle.com/arc/paymaster",
    code: "pm_sponsorUserOperation\n→ relayer gas sponsored by Circle",
  },
  {
    name: "Agent Stack",
    tag: "AGENTIC ECONOMY",
    color: "text-[var(--tertiary)]",
    border: "border-[var(--tertiary)]/30",
    desc: "Auto-harvest agent monitors vault claimable yield and executes harvestFor() autonomously when the threshold is met. Demonstrates agentic DeFi on Arc.",
    link: "https://developers.circle.com/arc/agent-stack",
    code: "GET /api/agent?user=0x...\n→ { shouldHarvest, agentExecuted }",
  },
];

const codeSnippets = [
  {
    title: "1. Forward intent from source chain",
    lang: "typescript",
    code: `// User signs on Base Sepolia — no network switch needed
const data = encodeFunctionData({
  abi: VAULT_ABI,
  functionName: "depositFor",
  args: [userAddress, amount],
});
await writeContract({
  address: GATEWAY_ADDRESS,   // Base Sepolia ArcGateway
  abi: ARC_GATEWAY_ABI,
  functionName: "forwardIntentWithData",
  args: [VAULT_ADDRESS, data], // targets Arc Testnet vault
});`,
  },
  {
    title: "2. Bridge USDC via Circle CCTP",
    lang: "typescript",
    code: `// Burns USDC on Base Sepolia, mints on Arc natively
await writeContract({
  address: CCTP_TOKEN_MESSENGER, // Base Sepolia
  abi: TOKEN_MESSENGER_ABI,
  functionName: "depositForBurn",
  args: [
    amount,
    9,              // Arc domain ID
    mintRecipient,  // vault address as bytes32
    SOURCE_USDC,
  ],
});`,
  },
  {
    title: "3. Agent auto-harvest check",
    lang: "typescript",
    code: `// Agent evaluates harvest condition
const res = await fetch(\`/api/agent?user=\${address}\`);
const { shouldHarvest, claimable, agentExecuted } = await res.json();
// If AGENT_PRIVATE_KEY is set server-side and shouldHarvest=true,
// the agent calls ArcExecutor.executeWithData autonomously`,
  },
];

export default function SDKPage() {
  return (
    <div className="mx-auto max-w-6xl py-10 md:py-16">
      <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">CIRCLE DEVELOPER STACK</p>
      <h1 className="mt-4 text-5xl font-bold text-white md:text-6xl">Built with Circle.</h1>
      <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
        ArcFlow uses Arc, USDC, CCTP, Paymaster, and the Agent Stack — Circle's full developer suite for stablecoin-native DeFi.
      </p>

      {/* Circle stack cards */}
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {circleStack.map((item) => (
          <div key={item.name} className={`neo-card flex flex-col gap-4 p-6 ${item.border}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`text-[10px] font-bold tracking-[.14em] ${item.color}`}>{item.tag}</span>
                <h3 className="mt-1 text-lg font-bold text-white">{item.name}</h3>
              </div>
              <a href={item.link} target="_blank" rel="noreferrer" className={`mt-1 ${item.color} hover:opacity-70`}>
                <ExternalLink className="size-4" />
              </a>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
            <pre className="rounded-lg bg-black/40 p-3 font-mono text-xs text-[var(--primary)]/80 overflow-x-auto">{item.code}</pre>
          </div>
        ))}
      </div>

      {/* Code snippets */}
      <div className="mt-14">
        <p className="mb-6 text-xs font-bold tracking-[.14em] text-[var(--primary)]">INTEGRATION EXAMPLES</p>
        <div className="space-y-5">
          {codeSnippets.map((snippet) => (
            <div key={snippet.title} className="neo-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--line)] px-5 py-3">
                <Code2 className="size-4 text-[var(--primary)]" />
                <p className="text-sm font-bold text-white">{snippet.title}</p>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-[var(--primary)]/80">{snippet.code}</pre>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-14 grid gap-4 md:grid-cols-4">
        {[
          { icon: <Zap className="size-5" />, label: "USDC Vault", href: "/vault", desc: "Live demo" },
          { icon: <GitBranch className="size-5" />, label: "Architecture", href: "/architecture", desc: "System diagram" },
          { icon: <Bot className="size-5" />, label: "Agent API", href: "/api/agent", desc: "Harvest agent" },
          { icon: <Shield className="size-5" />, label: "GitHub", href: "https://github.com/marotipatre/ETHGlobal-Online-2026", desc: "Source code", external: true },
        ].map((item) => (
          item.external ? (
            <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
              className="remit-card flex items-center gap-3 p-4 hover:border-[var(--primary)]">
              <span className="text-[var(--primary)]">{item.icon}</span>
              <div><p className="font-bold text-white">{item.label}</p><p className="text-xs text-[var(--muted)]">{item.desc}</p></div>
              <ExternalLink className="ml-auto size-3 text-[var(--muted)]" />
            </a>
          ) : (
            <Link key={item.label} href={item.href}
              className="remit-card flex items-center gap-3 p-4 hover:border-[var(--primary)]">
              <span className="text-[var(--primary)]">{item.icon}</span>
              <div><p className="font-bold text-white">{item.label}</p><p className="text-xs text-[var(--muted)]">{item.desc}</p></div>
              <ArrowRight className="ml-auto size-3 text-[var(--muted)]" />
            </Link>
          )
        ))}
      </div>
    </div>
  );
}
