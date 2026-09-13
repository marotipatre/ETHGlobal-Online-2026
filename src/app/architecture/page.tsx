import { ArrowRight, ArrowDown, ExternalLink, Shield, Zap, Radio, CircleDollarSign, Server } from "lucide-react";
import Link from "next/link";

const contracts = [
  { label: "ArcGateway.sol", chain: "Somnia Testnet", address: "0x96DBFD24b4d6aC9f0D00E9fFb59d7b76C3ae34af", explorer: "https://shannon-explorer.somnia.network/address/0x96DBFD24b4d6aC9f0D00E9fFb59d7b76C3ae34af" },
  { label: "ArcGateway.sol", chain: "Base Sepolia", address: "0xfC18C1Ae3ac3242ea7dB7839D396f51F8692F5EA", explorer: "https://sepolia.basescan.org/address/0xfC18C1Ae3ac3242ea7dB7839D396f51F8692F5EA" },
  { label: "ArcGateway.sol", chain: "Monad Testnet", address: "0x039feAd52D2e8c818EdF837bef52D2Fd01aF7EeE", explorer: "https://testnet.monadvision.com/address/0x039feAd52D2e8c818EdF837bef52D2Fd01aF7EeE" },
  { label: "ArcExecutor.sol", chain: "Arc Testnet", address: "0x91e2F7324d27F6714d3b7F72BD2cc055dc3CE82D", explorer: "https://explorer.testnet.arc.network/address/0x91e2F7324d27F6714d3b7F72BD2cc055dc3CE82D" },
  { label: "StablecoinVault.sol", chain: "Arc Testnet", address: "0x6CEB9E7404ea63D102Fa3dEc736be16a439bD7DB", explorer: "https://explorer.testnet.arc.network/address/0x6CEB9E7404ea63D102Fa3dEc736be16a439bD7DB" },
  { label: "USDC (Arc Testnet)", chain: "Arc Testnet", address: "0x3600000000000000000000000000000000000000", explorer: "https://explorer.testnet.arc.network/address/0x3600000000000000000000000000000000000000" },
];

const steps = [
  { n: "01", icon: <Zap className="size-5" />, title: "User signs intent", desc: "Wallet signs forwardIntent() or forwardIntentWithData() on the source chain gateway. No bridging, no network switch required.", chain: "Source Chain" },
  { n: "02", icon: <Radio className="size-5" />, title: "Gateway emits event", desc: "ArcGateway records a nonce and emits IntentForwarded or IntentForwardedWithData. Zero state stored — pure event emission.", chain: "Source Chain" },
  { n: "03", icon: <Server className="size-5" />, title: "Relayer detects & routes", desc: "Off-chain TypeScript relayer polls source chains, validates the target against an allowlist, and submits executeWithData() to Arc.", chain: "Off-Chain" },
  { n: "04", icon: <Shield className="size-5" />, title: "ArcExecutor verifies", desc: "ArcExecutor checks relayer authorization, maps the source wallet to its Universal Arc Account, and calls the target contract.", chain: "Arc Testnet" },
  { n: "05", icon: <CircleDollarSign className="size-5" />, title: "Vault executes", desc: "StablecoinVault processes depositFor, withdrawFor, or harvestFor against real Arc-held USDC. Principal is 1:1 backed.", chain: "Arc Testnet" },
];

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl py-10 md:py-16">
      <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">SYSTEM ARCHITECTURE</p>
      <h1 className="mt-4 text-5xl font-bold text-white md:text-6xl">How ArcFlow works.</h1>
      <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
        A cross-chain intent pipeline built on Arc — Circle's EVM-compatible L1. Source-chain wallets control Arc-native USDC without bridging.
      </p>

      {/* Main flow diagram */}
      <div className="mt-12 grid gap-4 md:grid-cols-5">
        {steps.map((step, i) => (
          <div key={step.n} className="flex flex-col items-center gap-3 md:contents">
            <div className={`remit-card flex flex-col gap-4 p-5 md:col-span-1 ${step.chain === "Arc Testnet" ? "border-[var(--primary)]/40" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--primary)]">{step.n}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${step.chain === "Arc Testnet" ? "bg-[var(--primary)]/15 text-[var(--primary)]" : step.chain === "Off-Chain" ? "bg-white/10 text-[var(--muted)]" : "bg-blue-500/15 text-blue-300"}`}>
                  {step.chain}
                </span>
              </div>
              <div className="grid size-10 place-items-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                {step.icon}
              </div>
              <h3 className="font-bold text-white">{step.title}</h3>
              <p className="text-xs leading-relaxed text-[var(--muted)]">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center justify-center md:hidden">
                <ArrowDown className="size-5 text-[var(--primary)]/50" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Arrow row for desktop */}
      <div className="mt-2 hidden items-center justify-between px-[10%] md:flex">
        {Array.from({ length: 4 }).map((_, i) => (
          <ArrowRight key={i} className="size-5 text-[var(--primary)]/40" />
        ))}
      </div>

      {/* Layer breakdown */}
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <div className="neo-card p-6">
          <p className="text-xs font-bold tracking-[.14em] text-blue-300">SOURCE LAYER</p>
          <h2 className="mt-3 text-xl font-bold text-white">3 Source Chains</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-blue-300" />Somnia Testnet</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-blue-300" />Base Sepolia</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-blue-300" />Monad Testnet</li>
          </ul>
          <p className="mt-4 text-xs text-[var(--muted)]">ArcGateway deployed on each. Nonce-based replay protection. Zero state stored.</p>
        </div>
        <div className="neo-card p-6">
          <p className="text-xs font-bold tracking-[.14em] text-[var(--muted)]">OFF-CHAIN LAYER</p>
          <h2 className="mt-3 text-xl font-bold text-white">TypeScript Relayer</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-white/40" />Polls all source chains</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-white/40" />Target allowlist validation</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-white/40" />Retry + duplicate protection</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-white/40" />Health + history JSON</li>
          </ul>
        </div>
        <div className="neo-card border-[var(--primary)]/30 p-6">
          <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">ARC DESTINATION LAYER</p>
          <h2 className="mt-3 text-xl font-bold text-white">Arc Testnet (Circle L1)</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[var(--primary)]" />ArcExecutor — auth + dispatch</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[var(--primary)]" />StablecoinVault — USDC vault</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[var(--primary)]" />Arc USDC — native stablecoin</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[var(--primary)]" />Universal Arc Account mapping</li>
          </ul>
        </div>
      </div>

      {/* Vault flow detail */}
      <div className="mt-10 neo-card p-6 md:p-8">
        <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">VAULT FLOW DETAIL</p>
        <h2 className="mt-3 text-2xl font-bold text-white">USDC Vault — 3 intent types</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { action: "depositFor(user, amount)", label: "Deposit", desc: "Moves user's Arc-side pending USDC into vault shares. Requires prior fundFor() on Arc.", color: "text-[var(--success)]" },
            { action: "withdrawFor(user, amount)", label: "Withdraw", desc: "Burns shares and transfers USDC back to the user's Arc address. 1:1 principal.", color: "text-[var(--danger)]" },
            { action: "harvestFor(user)", label: "Harvest", desc: "Claims sponsor-funded yield accrued to the user's shares. No simulated APY.", color: "text-[var(--primary)]" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--line)] bg-black/20 p-4">
              <p className={`text-sm font-bold ${item.color}`}>{item.label}</p>
              <p className="mt-1 font-mono text-xs text-[var(--muted)]">{item.action}</p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-black/20 p-4 text-xs text-[var(--muted)]">
          <span className="font-bold text-white">Backing invariant:</span>
          <code className="rounded bg-white/5 px-2 py-0.5 font-mono">usdc.balanceOf(vault) ≥ totalShares + totalPending + yieldReserve</code>
          <span>— enforced on every state change.</span>
        </div>
      </div>

      {/* Live contracts */}
      <div className="mt-10">
        <p className="mb-5 text-xs font-bold tracking-[.14em] text-[var(--primary)]">LIVE DEPLOYED CONTRACTS</p>
        <div className="grid gap-3 md:grid-cols-2">
          {contracts.map((c) => (
            <a key={c.address} href={c.explorer} target="_blank" rel="noreferrer"
              className="remit-card flex items-center justify-between gap-4 p-4 hover:border-[var(--primary)]">
              <div>
                <p className="font-bold text-white">{c.label}</p>
                <p className="text-xs text-[var(--muted)]">{c.chain}</p>
                <p className="mt-1 font-mono text-xs text-[var(--muted)]">{c.address.slice(0, 18)}…</p>
              </div>
              <ExternalLink className="size-4 shrink-0 text-[var(--primary)]" />
            </a>
          ))}
        </div>
      </div>

      {/* Security notes */}
      <div className="mt-10 remit-card p-6">
        <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">SECURITY MODEL</p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          {[
            ["Nonce replay protection", "ArcGateway increments per-user nonces; duplicate intents are rejected by the relayer."],
            ["Relayer allowlist", "ArcExecutor only accepts calls from authorized relayer addresses set by the owner."],
            ["Target allowlist", "Relayer validates calldata targets against Counter, Todo, and Vault only."],
            ["Reentrancy guard", "StablecoinVault uses a lockState mutex on all state-changing functions."],
            ["1:1 backing check", "backing() exposes balance vs liabilities; UI shows it live."],
            ["Testnet scope", "Centralized relayer — not production. Proof verification required before mainnet."],
          ].map(([title, desc]) => (
            <div key={String(title)} className="flex gap-3">
              <Shield className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
              <div>
                <p className="font-bold text-white">{title}</p>
                <p className="text-[var(--muted)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/vault" className="neo-button inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm text-black">
          Open USDC Vault <ArrowRight className="size-4" />
        </Link>
        <a href="https://github.com/marotipatre/ETHGlobal-Online-2026" target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-5 py-3 text-sm font-semibold text-white hover:border-[var(--primary)]">
          View on GitHub <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
}
