import Link from "next/link";
import { ArrowRight, Check, Code2, Layers3, Radio, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

const steps = [
  ["01", "Choose a source", "Connect on Somnia, Base Sepolia, or Monad Testnet and sign an intent."],
  ["02", "Route through ArcGateway", "The gateway records the intent without a bridge or a network switch."],
  ["03", "Execute on Arc", "The relayer calls ArcExecutor on Arc Testnet and records the result."],
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl pb-12 pt-8 md:pt-16">
      <section className="grid items-end gap-10 border-b border-[var(--line)] pb-16 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold tracking-[.14em] text-[var(--primary)]"><Radio className="size-3.5" /> CROSS-CHAIN EXECUTION</p>
          <h1 className="max-w-4xl text-5xl font-bold leading-[.98] tracking-tight text-white md:text-7xl">Build once.<br /><span className="text-[var(--primary)]">Execute on Arc.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">ArcFlow gives users on Somnia, Base Sepolia, and Monad Testnet a direct intent path to Arc Testnet. Choose a supported source network, sign in your wallet, and track execution on Arc.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/counter-app"><Button size="lg">Try the counter <ArrowRight className="ml-2 size-4" /></Button></Link><Link href="/todo-app"><Button variant="secondary" size="lg">Open todo demo</Button></Link></div>
        </div>
        <div className="remit-card p-6"><p className="text-xs font-bold tracking-[.16em] text-[var(--muted)]">DESTINATION NETWORK</p><p className="mt-3 text-3xl font-bold text-white">Arc Testnet</p><div className="my-6 h-px bg-[var(--line)]" /><div className="space-y-3 text-sm text-[var(--muted)]"><p className="flex gap-2"><Check className="size-4 shrink-0 text-[var(--primary)]" /> RainbowKit wallet connection</p><p className="flex gap-2"><Check className="size-4 shrink-0 text-[var(--primary)]" /> Three live source testnets</p><p className="flex gap-2"><Check className="size-4 shrink-0 text-[var(--primary)]" /> Arc relayer execution history</p></div></div>
      </section>

      <section className="py-16"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">THE FLOW</p><h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">One intent, clear execution.</h2></div><Link href="/architecture" className="hidden text-sm font-bold text-[var(--primary)] hover:underline sm:block">View architecture →</Link></div><div className="grid gap-4 md:grid-cols-3">{steps.map(([number, title, copy]) => <article key={number} className="remit-card p-6"><span className="text-sm font-bold text-[var(--primary)]">{number}</span><h3 className="mt-8 text-xl font-bold text-white">{title}</h3><p className="mt-3 leading-relaxed text-[var(--muted)]">{copy}</p></article>)}</div></section>

      <section className="grid gap-4 md:grid-cols-3"><article className="remit-card p-6"><Zap className="size-5 text-[var(--primary)]" /><h3 className="mt-5 font-bold text-white">Clear network choices</h3><p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Only deployed and configured source networks can submit intents.</p></article><article className="remit-card p-6"><Layers3 className="size-5 text-[var(--primary)]" /><h3 className="mt-5 font-bold text-white">Real Arc state</h3><p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Counter and Todo reads remain pointed at their Arc Testnet contracts.</p></article><article className="remit-card p-6"><Code2 className="size-5 text-[var(--primary)]" /><h3 className="mt-5 font-bold text-white">Live intent tracking</h3><p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Source and Arc transaction hashes appear as the relayer advances each intent.</p></article></section>
      <section className="mt-16 flex flex-col gap-5 rounded-2xl border border-[var(--primary)]/25 bg-[var(--primary)]/8 p-7 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 font-bold text-white"><ShieldCheck className="size-5 text-[var(--primary)]" /> Arc functionality, refreshed presentation</div><p className="mt-2 text-sm text-[var(--muted)]">A Next.js-only interface migration; no Algorand code or runtime has been introduced.</p></div><Link href="/sdk"><Button variant="secondary">Read SDK guide</Button></Link></section>
    </div>
  );
}
