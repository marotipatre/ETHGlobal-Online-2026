"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { encodeFunctionData, formatUnits, parseUnits } from "viem";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { arcTestnet } from "@/config/chains";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { ARC_USDC_ABI, VAULT_ABI } from "@/lib/vault";
import { SourceNetworkSelector } from "./SourceNetworkSelector";
import { IntentProgress } from "./IntentProgress";
import { useIntentFlow } from "@/hooks/IntentFlowContext";

type Snapshot = {
  wallet: bigint;
  pending: bigint;
  shares: bigint;
  claimable: bigint;
  tvl: bigint;
  totalPending: bigint;
  reserve: bigint;
  balance: bigint;
  liabilities: bigint;
  paused: boolean;
};
const zero: Snapshot = {
  wallet: BigInt(0),
  pending: BigInt(0),
  shares: BigInt(0),
  claimable: BigInt(0),
  tvl: BigInt(0),
  totalPending: BigInt(0),
  reserve: BigInt(0),
  balance: BigInt(0),
  liabilities: BigInt(0),
  paused: false,
};
const usd = (value: bigint) =>
  Number(formatUnits(value, 6)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const address = (value: string) => value as `0x${string}`;

export function VaultDashboard() {
  const { address: user, isConnected } = useAccount();
  const chainId = useChainId();
  const arc = usePublicClient({ chainId: arcTestnet.id });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const flow = useIntentFlow();
  const [snapshot, setSnapshot] = useState<Snapshot>(zero);
  const [amount, setAmount] = useState("1.00");
  const [tab, setTab] = useState<"deposit" | "withdraw" | "harvest">("deposit");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const configured = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESSES.VAULT);

  const refresh = useCallback(async () => {
    if (!arc || !configured) return;
    const vault = address(CONTRACT_ADDRESSES.VAULT);
    const token = address(CONTRACT_ADDRESSES.ARC_USDC);
    try {
      const [
        tvl,
        totalPending,
        reserve,
        backing,
        paused,
        wallet,
        pending,
        shares,
        claimable,
      ] = await Promise.all([
        arc.readContract({
          address: vault,
          abi: VAULT_ABI,
          functionName: "totalShares",
        }),
        arc.readContract({
          address: vault,
          abi: VAULT_ABI,
          functionName: "totalPending",
        }),
        arc.readContract({
          address: vault,
          abi: VAULT_ABI,
          functionName: "yieldReserve",
        }),
        arc.readContract({
          address: vault,
          abi: VAULT_ABI,
          functionName: "backing",
        }),
        arc.readContract({
          address: vault,
          abi: VAULT_ABI,
          functionName: "paused",
        }),
        user
          ? arc.readContract({
              address: token,
              abi: ARC_USDC_ABI,
              functionName: "balanceOf",
              args: [user],
            })
          : Promise.resolve(BigInt(0)),
        user
          ? arc.readContract({
              address: vault,
              abi: VAULT_ABI,
              functionName: "pending",
              args: [user],
            })
          : Promise.resolve(BigInt(0)),
        user
          ? arc.readContract({
              address: vault,
              abi: VAULT_ABI,
              functionName: "shares",
              args: [user],
            })
          : Promise.resolve(BigInt(0)),
        user
          ? arc.readContract({
              address: vault,
              abi: VAULT_ABI,
              functionName: "claimable",
              args: [user],
            })
          : Promise.resolve(BigInt(0)),
      ]);
      setSnapshot({
        tvl,
        totalPending,
        reserve,
        balance: backing[0],
        liabilities: backing[1],
        paused,
        wallet,
        pending,
        shares,
        claimable,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Arc vault read failed"
      );
    }
  }, [arc, configured, user]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 6000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (flow.phase === "completed" || flow.phase === "failed") void refresh();
  }, [flow.phase, refresh]);

  const units = useMemo(() => {
    try {
      return parseUnits(amount, 6);
    } catch {
      return BigInt(0);
    }
  }, [amount]);
  const enough =
    tab === "deposit" ? snapshot.pending >= units : snapshot.shares >= units;
  const canSubmit =
    isConnected &&
    configured &&
    Boolean(flow.source?.gateway) &&
    flow.relayerOnline &&
    !snapshot.paused &&
    !busy &&
    !flow.isForwarding &&
    (tab === "harvest"
      ? snapshot.claimable > BigInt(0)
      : units > BigInt(0) && enough);

  async function fund() {
    if (
      !user ||
      !arc ||
      !configured ||
      units <= BigInt(0) ||
      units > snapshot.wallet
    )
      return;
    setBusy(true);
    setLocalError(null);
    setNotice(null);
    try {
      if (chainId !== arcTestnet.id)
        await switchChainAsync({ chainId: arcTestnet.id });
      const vault = address(CONTRACT_ADDRESSES.VAULT);
      const token = address(CONTRACT_ADDRESSES.ARC_USDC);
      const allowance = await arc.readContract({
        address: token,
        abi: ARC_USDC_ABI,
        functionName: "allowance",
        args: [user, vault],
      });
      if (allowance < units) {
        const approveHash = await writeContractAsync({
          address: token,
          abi: ARC_USDC_ABI,
          functionName: "approve",
          args: [vault, units],
          chainId: arcTestnet.id,
        });
        const approval = await arc.waitForTransactionReceipt({
          hash: approveHash,
        });
        if (approval.status !== "success")
          throw new Error("USDC approval failed");
      }
      const hash = await writeContractAsync({
        address: vault,
        abi: VAULT_ABI,
        functionName: "fundFor",
        args: [user, units],
        chainId: arcTestnet.id,
      });
      const receipt = await arc.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Arc funding failed");
      setNotice(
        `${usd(
          units
        )} test USDC funded on Arc. Switch to a source network, then submit your deposit intent.`
      );
      await refresh();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Funding failed");
    } finally {
      setBusy(false);
    }
  }

  async function reclaim() {
    if (!user || !arc || snapshot.pending <= BigInt(0) || !configured) return;
    setBusy(true);
    setLocalError(null);
    setNotice(null);
    try {
      if (chainId !== arcTestnet.id)
        await switchChainAsync({ chainId: arcTestnet.id });
      const hash = await writeContractAsync({
        address: address(CONTRACT_ADDRESSES.VAULT),
        abi: VAULT_ABI,
        functionName: "reclaimPending",
        args: [snapshot.pending],
        chainId: arcTestnet.id,
      });
      const receipt = await arc.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Reclaim failed");
      setNotice("Unused pending USDC returned to your Arc wallet.");
      await refresh();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Reclaim failed");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!user || !canSubmit) return;
    setLocalError(null);
    setNotice(null);
    const method =
      tab === "deposit"
        ? "depositFor"
        : tab === "withdraw"
        ? "withdrawFor"
        : "harvestFor";
    const data = encodeFunctionData({
      abi: VAULT_ABI,
      functionName: method,
      args: tab === "harvest" ? [user] : [user, units],
    });
    await flow.submit(
      data,
      tab,
      tab === "harvest" ? undefined : units.toString()
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8 md:py-14">
      <div className="mb-9 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold tracking-[.14em] text-[var(--primary)]">
            <CircleDollarSign className="size-4" /> FLAGSHIP DEMO · ARC TESTNET
          </p>
          <h1 className="text-5xl font-bold leading-none tracking-tight text-white md:text-7xl">
            A vault that <span className="text-[var(--primary)]">listens.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
            Control real, Arc-held test USDC from another chain. Your intent
            moves the instruction; the funds remain backed on Arc.
          </p>
        </div>
        <a
          href={`${arcTestnet.blockExplorers.default.url}/address/${CONTRACT_ADDRESSES.VAULT}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
        >
          View live vault contract <ExternalLink className="size-4" />
        </a>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          ["Vault principal", snapshot.tvl, "1:1 USDC shares"],
          ["Your shares", snapshot.shares, "Redeemable on Arc"],
          ["Pending funding", snapshot.pending, "Not yet deposited"],
          ["Funded yield", snapshot.claimable, "No simulated APY"],
        ].map(([label, value, sub]) => (
          <div key={String(label)} className="remit-card p-5">
            <p className="text-xs font-bold uppercase tracking-[.13em] text-[var(--muted)]">
              {String(label)}
            </p>
            <p className="mt-4 text-3xl font-bold text-white">
              ${usd(value as bigint)}
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">{String(sub)}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="neo-card overflow-hidden">
          <div className="border-b border-[var(--line)] p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">
                  01 / BACK THE INTENT
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Fund on Arc first
                </h2>
              </div>
              <Wallet className="size-6 text-[var(--primary)]" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Fund a pending balance with Arc test USDC. This is the liquidity
              on the destination side. No source-chain asset is silently bridged
              or minted.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--line)] bg-black/20 p-4">
                <p className="text-xs text-[var(--muted)]">Your Arc wallet</p>
                <p className="mt-1 font-bold text-white">
                  ${usd(snapshot.wallet)} USDC
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-black/20 p-4">
                <p className="text-xs text-[var(--muted)]">Vault backing</p>
                <p
                  className={`mt-1 font-bold ${
                    snapshot.balance >= snapshot.liabilities
                      ? "text-[var(--success)]"
                      : "text-[var(--danger)]"
                  }`}
                >
                  ${usd(snapshot.balance)} / ${usd(snapshot.liabilities)}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fund}
                disabled={
                  !isConnected ||
                  units <= BigInt(0) ||
                  units > snapshot.wallet ||
                  busy ||
                  !configured ||
                  snapshot.paused
                }
                className="neo-button rounded-xl bg-[var(--primary)] px-5 py-3 text-sm text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Confirming on Arc…" : `Approve & fund $${usd(units)}`}
              </button>
              <button
                type="button"
                onClick={reclaim}
                disabled={
                  !isConnected || snapshot.pending === BigInt(0) || busy
                }
                className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Reclaim pending
              </button>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" />
              <p className="text-sm text-[var(--muted)]">
                Principal is 1:1 backed by USDC in this vault. Yield only
                appears when a sponsor transfers additional real test USDC.
                There is no strategy, promised return, or cross-chain withdrawal
                liquidity.
              </p>
            </div>
            <a
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:underline"
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noreferrer"
            >
              Need test USDC? Circle faucet <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <div className="neo-card p-6 md:p-8">
          <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">
            02 / SEND THE INSTRUCTION
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Manage from any source
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            After funding, switch to Somnia, Base Sepolia, or Monad and send an
            intent. The relayer executes it on Arc.
          </p>
          <div className="mt-6 flex rounded-xl border border-[var(--line)] bg-black/20 p-1">
            {(["deposit", "withdraw", "harvest"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`flex-1 rounded-lg px-2 py-2 text-sm font-bold capitalize ${
                  tab === value
                    ? "bg-[var(--primary)] text-black"
                    : "text-[var(--muted)] hover:text-white"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          {tab !== "harvest" ? (
            <label className="mt-6 block text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">
              Amount · USDC
              <input
                className="neo-input mt-2 w-full px-4 py-4 text-xl font-bold"
                type="number"
                min="0.000001"
                step="0.000001"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
          ) : (
            <div className="mt-6 rounded-xl border border-[var(--line)] bg-black/20 p-4">
              <p className="text-xs text-[var(--muted)]">
                Available sponsor-funded yield
              </p>
              <p className="mt-1 text-2xl font-bold text-white">
                ${usd(snapshot.claimable)}
              </p>
            </div>
          )}
          <div className="mt-5 rounded-xl border border-[var(--line)] bg-black/20 p-4 text-sm text-[var(--muted)]">
            {tab === "deposit"
              ? `Available to deposit: $${usd(snapshot.pending)} pending on Arc`
              : tab === "withdraw"
              ? `Available to withdraw: $${usd(
                  snapshot.shares
                )} in vault shares`
              : `Vault-wide unclaimed yield reserve: $${usd(snapshot.reserve)}`}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="neo-button mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-4 text-sm text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {flow.isForwarding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : tab === "deposit" ? (
              <ArrowUpRight className="size-4" />
            ) : (
              <ArrowDownLeft className="size-4" />
            )}
            {tab === "harvest"
              ? "Harvest funded yield"
              : `${
                  tab === "deposit" ? "Deposit" : "Withdraw"
                } with cross-chain intent`}
          </button>
          <p className="mt-3 text-xs text-[var(--muted)]">
            {!isConnected
              ? "Connect your wallet to begin."
              : snapshot.paused
              ? "Vault is paused."
              : !flow.source?.gateway
              ? "Select a supported source network below."
              : !flow.relayerOnline
              ? "Relayer offline: intent submission is paused."
              : tab !== "harvest" && !enough
              ? "Insufficient Arc-side balance for this action."
              : tab === "harvest" && snapshot.claimable === BigInt(0)
              ? "No funded yield to harvest yet."
              : "Ready to sign on your source network."}
          </p>
        </div>
      </div>
      {(localError || notice) && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm ${
            localError
              ? "border-[var(--danger)]/40 text-[var(--danger)]"
              : "border-[var(--success)]/40 text-[var(--success)]"
          }`}
        >
          {localError || notice}
        </div>
      )}
      <SourceNetworkSelector />
      <div className="remit-card p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">
              03 / WATCH IT LAND
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Live execution
            </h2>
          </div>
          <CheckCircle2 className="size-6 text-[var(--primary)]" />
        </div>
        <IntentProgress
          phase={flow.phase}
          intent={flow.activeIntent}
          relayerOnline={flow.relayerOnline}
          error={flow.error}
        />
        {flow.intents.length > 0 && (
          <div className="mt-6 space-y-2">
            {flow.intents.slice(0, 5).map((item) => (
              <div
                key={`${item.sourceChainId}:${item.txHash}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-black/20 px-4 py-3 text-sm"
              >
                <span className="capitalize text-white">
                  {item.action || "vault intent"}
                </span>
                <span
                  className={
                    item.status === "completed"
                      ? "text-[var(--success)]"
                      : item.status === "failed"
                      ? "text-[var(--danger)]"
                      : "text-yellow-200"
                  }
                >
                  {item.status}
                </span>
                <span className="font-mono text-xs text-[var(--muted)]">
                  {item.txHash.slice(0, 10)}…
                </span>
              </div>
            ))}
          </div>
        )}
        {flow.intents.length === 0 && (
          <p className="mt-5 text-sm text-[var(--muted)]">
            Your vault intent history will appear here after a source
            transaction is signed.
          </p>
        )}
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
        <span>ARC TESTNET · TEST USDC ONLY</span>
        <ArrowRight className="size-3" />
        <span>No automatic bridge</span>
        <ArrowRight className="size-3" />
        <span>No guaranteed APY</span>
      </div>
    </div>
  );
}
