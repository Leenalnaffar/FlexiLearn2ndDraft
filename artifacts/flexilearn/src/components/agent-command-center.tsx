import { Brain, Map, Zap, Eye, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useGetAgentsStatus, getGetAgentsStatusQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface AgentInfo {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const agentMeta: AgentInfo[] = [
  { id: "profiling", icon: Brain, color: "#3B5BDB" },
  { id: "planning", icon: Map, color: "#3B5BDB" },
  { id: "neuroadapt", icon: Zap, color: "#5F9E6E" },
  { id: "observation", icon: Eye, color: "#5F9E6E" },
];

function StatusBadge({ status }: { status: string }) {
  const config = {
    idle: { label: "Idle", className: "bg-gray-100 text-gray-500" },
    active: { label: "Active", className: "bg-blue-50 text-blue-600" },
    loading: { label: "Processing", className: "bg-amber-50 text-amber-600" },
    complete: { label: "Complete", className: "bg-green-50 text-green-600" },
    error: { label: "Error", className: "bg-red-50 text-red-600" },
  }[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };

  return (
    <span
      className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", config.className)}
      data-testid={`agent-status-badge-${status}`}
    >
      {config.label}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
  if (status === "error") return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  if (status === "idle") return <Clock className="w-3.5 h-3.5 text-gray-400" />;
  return null;
}

export default function AgentCommandCenter() {
  const { data: agents, isLoading } = useGetAgentsStatus({
    query: {
      refetchInterval: 3000,
      queryKey: getGetAgentsStatusQueryKey(),
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Agent Command Center
        </h3>
        <p className="text-xs text-muted-foreground/70 mt-0.5">System Status</p>
      </div>

      {/* Agent Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {isLoading && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-border bg-gray-50 animate-pulse"
                style={{ height: 90 }}
              />
            ))}
          </>
        )}

        {agents?.map((agent) => {
          const meta = agentMeta.find((m) => m.id === agent.id);
          const Icon = meta?.icon ?? Brain;
          const isActiveOrLoading = agent.status === "active" || agent.status === "loading";

          return (
            <div
              key={agent.id}
              data-testid={`agent-card-${agent.id}`}
              className={cn(
                "p-3 rounded-xl border transition-all duration-300",
                isActiveOrLoading
                  ? "border-blue-200 bg-blue-50/50"
                  : agent.status === "complete"
                  ? "border-green-200 bg-green-50/30"
                  : "border-border bg-gray-50/50"
              )}
            >
              {/* Icon + Name + Status */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                      isActiveOrLoading ? "agent-pulse" : ""
                    )}
                    style={{
                      backgroundColor: isActiveOrLoading
                        ? "#3B5BDB15"
                        : agent.status === "complete"
                        ? "#5F9E6E15"
                        : "#f1f5f9",
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{
                        color: isActiveOrLoading
                          ? "#3B5BDB"
                          : agent.status === "complete"
                          ? "#5F9E6E"
                          : "#94a3b8",
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight">{agent.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <StatusIcon status={agent.status} />
                  {isActiveOrLoading && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 agent-pulse" />
                  )}
                </div>
              </div>

              <StatusBadge status={agent.status} />

              {/* Progress bar */}
              {agent.progressPercent != null && agent.progressPercent > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Progress</span>
                    <span className="text-[10px] font-medium text-foreground">
                      {Math.round(agent.progressPercent)}%
                    </span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        agent.status === "complete"
                          ? "bg-green-500"
                          : isActiveOrLoading
                          ? "progress-shimmer"
                          : "bg-gray-300"
                      )}
                      style={{ width: `${agent.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Current task */}
              {agent.currentTask && (
                <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                  {agent.currentTask}
                </p>
              )}

              {/* Idle description */}
              {agent.status === "idle" && !agent.currentTask && (
                <p className="mt-1.5 text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2">
                  {agent.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">System operational</span>
        </div>
      </div>
    </div>
  );
}
