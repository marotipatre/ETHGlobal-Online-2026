"use client";

import { useIntentFlow, type IntentRecord, type IntentStatus } from "./IntentFlowContext";

export type { IntentStatus };
export type Intent = IntentRecord & { status: IntentStatus };

export function useIntent() {
  const flow = useIntentFlow();
  return {
    intents: flow.intents,
    forwardIntent: () => flow.submit(),
    isForwarding: flow.isForwarding,
    isLoadingHistory: flow.isLoadingHistory,
    error: flow.error,
    phase: flow.phase,
    activeIntent: flow.activeIntent,
    relayerOnline: flow.relayerOnline,
    source: flow.source,
  };
}
