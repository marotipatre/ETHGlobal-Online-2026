import Link from "next/link";
import { ArrowRight, CheckSquare2, Plus } from "lucide-react";

export default function BasicTestingPage() {
  return (
    <div className="mx-auto max-w-6xl py-10 md:py-16">
      <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">
        BASIC TESTING
      </p>
      <h1 className="mt-4 text-5xl font-bold text-white md:text-6xl">
        The primitives behind the vault.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
        Counter and Todo remain live examples of the same cross-chain intent
        pipeline. Use them to test a network and relayer before demonstrating
        USDC flows.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link
          href="/counter-app"
          className="remit-card group p-7 hover:border-[var(--primary)]"
        >
          <Plus className="size-7 text-[var(--primary)]" />
          <h2 className="mt-9 text-2xl font-bold text-white">Counter</h2>
          <p className="mt-3 text-[var(--muted)]">
            The smallest possible intent: increment Arc state from a
            source-chain wallet.
          </p>
          <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
            Open counter{" "}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link
          href="/todo-app"
          className="remit-card group p-7 hover:border-[var(--primary)]"
        >
          <CheckSquare2 className="size-7 text-[var(--primary)]" />
          <h2 className="mt-9 text-2xl font-bold text-white">Todo</h2>
          <p className="mt-3 text-[var(--muted)]">
            Structured calldata for add, toggle, and delete actions on Arc.
          </p>
          <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
            Open Todo{" "}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </div>
  );
}
