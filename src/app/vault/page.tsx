"use client";

import { VaultDashboard } from "@/components/VaultDashboard";
import { CctpBridgePanel } from "@/components/CctpBridgePanel";
import { AgentHarvestPanel } from "@/components/AgentHarvestPanel";
import { IntentFlowProvider } from "@/hooks/IntentFlowContext";

export default function VaultPage() {
  return (
    <IntentFlowProvider kind="vault">
      <VaultDashboard />
      <div className="mx-auto max-w-6xl pb-14">
        <p className="mb-5 text-xs font-bold tracking-[.14em] text-[var(--primary)]">CIRCLE STACK INTEGRATIONS</p>
        <div className="grid gap-6 md:grid-cols-2">
          <CctpBridgePanel />
          <AgentHarvestPanel />
        </div>
      </div>
    </IntentFlowProvider>
  );
}
