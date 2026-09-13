"use client";

import { useTodoIntent, type TodoIntentStatus } from "@/hooks/useTodoIntent";
import { Clock, CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw, Plus, ToggleLeft, Trash2 } from "lucide-react";
import { somniaTestnet, arcTestnet } from "@/config/chains";

function getStatusIcon(status: TodoIntentStatus) {
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

function getStatusBadgeColor(status: TodoIntentStatus) {
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

function getActionIcon(action: "add" | "toggle" | "delete") {
  switch (action) {
    case "add":
      return <Plus className="w-4 h-4 text-green-600" />;
    case "toggle":
      return <ToggleLeft className="w-4 h-4 text-blue-600" />;
    case "delete":
      return <Trash2 className="w-4 h-4 text-red-600" />;
  }
}

function getActionBadgeColor(action: "add" | "toggle" | "delete") {
  switch (action) {
    case "add":
      return "bg-green-100 text-green-800 border-green-500";
    case "toggle":
      return "bg-blue-100 text-blue-800 border-blue-500";
    case "delete":
      return "bg-red-100 text-red-800 border-red-500";
  }
}

export function TodoIntentHistory() {
  const { intents, isLoadingHistory } = useTodoIntent();

  if (isLoadingHistory) {
    return (
      <div className="neo-card p-8 bg-white">
        <h3 className="font-black text-xl text-black mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Todo Intent History
        </h3>
        <p className="text-black/60 text-center py-8">
          Loading intent history from blockchain...
        </p>
      </div>
    );
  }

  if (intents.length === 0) {
    return (
      <div className="neo-card p-8 bg-white">
        <h3 className="font-black text-xl text-black mb-4">Todo Intent History</h3>
        <p className="text-black/60 text-center py-8">
          No todo intents found. Add, toggle, or delete a todo to see it here!
        </p>
      </div>
    );
  }

  return (
    <div className="neo-card p-8 bg-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-xl text-black">Todo Intent History</h3>
        <div className="text-sm text-black/60 font-medium">
          {intents.length} intent{intents.length !== 1 ? "s" : ""}
        </div>
      </div>
      
      {/* Scrollable Table Container */}
      <div className="border-2 border-black rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_#000]">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-black text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Action
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Somnia TX
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Arc Execution
                </th>
                <th className="px-4 py-3 text-left font-black text-sm border-r-2 border-white/20">
                  Nonce
                </th>
                <th className="px-4 py-3 text-left font-black text-sm">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {intents.map((intent, index) => (
                <tr
                  key={`${intent.txHash}-${intent.nonce}`}
                  className={`border-b-2 border-black/20 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  {/* Action */}
                  <td className="px-4 py-3 border-r-2 border-black/10">
                    <div className="flex items-center gap-2">
                      {getActionIcon(intent.action)}
                      <span className={`px-2 py-1 rounded border-2 text-xs font-bold capitalize ${getActionBadgeColor(intent.action)}`}>
                        {intent.action}
                      </span>
                    </div>
                  </td>

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
                      href={`${somniaTestnet.blockExplorers.default.url}/tx/${intent.txHash}`}
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

                  {/* Data */}
                  <td className="px-4 py-3 text-sm text-black/80">
                    {intent.data ? (
                      <span className="font-mono text-xs">
                        {intent.action === "add" 
                          ? intent.data.length > 30 
                            ? `${intent.data.slice(0, 30)}...` 
                            : intent.data
                          : intent.data}
                      </span>
                    ) : (
                      <span className="text-xs text-black/60 italic">-</span>
                    )}
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
