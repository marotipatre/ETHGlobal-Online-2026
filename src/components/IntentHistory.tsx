"use client";

import { useIntent, type IntentStatus } from "@/hooks/useIntent";
import { Clock, CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { somniaTestnet, arcTestnet } from "@/config/chains";
import { getSourceNetwork } from "@/config/sourceChains";

function getStatusIcon(status: IntentStatus) {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case "detected":
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case "executing":
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

function getStatusBadgeColor(status: IntentStatus) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-500";
    case "detected":
    case "executing":
      return "bg-blue-100 text-blue-800 border-blue-500";
    case "completed":
      return "bg-green-100 text-green-800 border-green-500";
    case "failed":
      return "bg-red-100 text-red-800 border-red-500";
    default:
      return "bg-gray-100 text-gray-800 border-gray-500";
  }
}

export function IntentHistory() {
  const { intents, isLoadingHistory } = useIntent();

  if (isLoadingHistory && intents.length === 0) {
    return (
      <div className="neo-card p-8 bg-white">
        <h3 className="font-black text-xl text-black mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Intent History
        </h3>
        <p className="text-black/60 text-center py-8">
          Loading intent history...
        </p>
      </div>
    );
  }

  if (intents.length === 0) {
    return (
      <div className="neo-card p-8 bg-white">
        <h3 className="font-black text-xl text-black mb-4">Intent History</h3>
        <p className="text-black/60 text-center py-8">
          No intents found. Forward an intent to see it here!
        </p>
      </div>
    );
  }

  return (
    <div className="neo-card p-8 bg-white">
      <h3 className="font-black text-xl text-black mb-6">Intent History</h3>
      
      {/* Scrollable Table Container */}
      <div className="border-2 border-black rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_#000]">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-black text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Source TX
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Arc Execution
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Nonce
                </th>
                <th className="px-4 py-3 text-left font-black text-sm">
                  Target
                </th>
              </tr>
            </thead>
            <tbody>
              {intents.map((intent, index) => (
                <tr
                  key={intent.txHash}
                  className={`border-b-2 border-black/20 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  {/* Status */}
                  <td className="px-4 py-3 border-r-2 border-black/10">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(intent.status)}
                      <span className={`px-2 py-1 rounded border-2 text-xs font-bold capitalize ${getStatusBadgeColor(intent.status)}`}>
                        {intent.status}
                      </span>
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 border-r-2 border-black/10 text-sm text-black/80">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(intent.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-black/60">
                        {new Date(intent.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>

                  {/* Somnia TX */}
                  <td className="px-4 py-3 border-r-2 border-black/10">
                    <a
                      href={`${getSourceNetwork(intent.sourceChainId || somniaTestnet.id)?.chain.blockExplorers?.default.url || somniaTestnet.blockExplorers.default.url}/tx/${intent.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm font-mono"
                    >
                      {intent.txHash.slice(0, 8)}...{intent.txHash.slice(-6)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>

                  {/* Arc Execution */}
                  <td className="px-4 py-3 border-r-2 border-black/10">
                    {intent.executionHash ? (
                      <a
                        href={`${arcTestnet.blockExplorers.default.url}/tx/${intent.executionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm font-mono"
                      >
                        {intent.executionHash.slice(0, 8)}...{intent.executionHash.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-black/60 italic">Pending</span>
                    )}
                  </td>

                  {/* Nonce */}
                  <td className="px-4 py-3 border-r-2 border-black/10 text-sm font-mono text-black/80">
                    {intent.nonce}
                  </td>

                  {/* Target */}
                  <td className="px-4 py-3 text-sm font-mono text-black/80">
                    {intent.target.slice(0, 8)}...{intent.target.slice(-6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
