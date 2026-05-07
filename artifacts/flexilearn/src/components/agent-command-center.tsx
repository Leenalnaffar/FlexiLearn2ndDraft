import { Brain, Map, Zap, Eye, CheckCircle, Clock } from "lucide-react";
import { useAgentOrchestration, type AgentStatus } from "@/context/agent-orchestration";
import { cn } from "@/lib/utils";
import { useMemorySystem } from "@/hooks/use-memory-system";

interface AgentMeta {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AGENT_META: AgentMeta[] = [
  {
    id: "profiling",
    name: "Profiling Agent",
    description: "Analyses your learning patterns and cognitive preferences to build an accurate learner model.",
    icon: Brain,
  },
  {
    id: "planning",
    name: "Planning Agent",
    description: "Generates personalised learning paths and roadmaps based on your goals and profile.",
    icon: Map,
  },
  {
    id: "neuroadapt",
    name: "NeuroAdapt Agent",
    description: "Adjusts content presentation format and pacing to match your neurocognitive profile.",
    icon: Zap,
  },
  {
    id: "observation",
    name: "Observation Agent",
    description: "Monitors engagement signals and performance metrics to detect when adaptations are needed.",
    icon: Eye,
  },
];

function StatusBadge({ status }: { status: AgentStatus }) {
  const config: Record<AgentStatus, { label: string; className: string }> = {
    idle:     { label: "Idle",       className: "bg-gray-100 text-gray-500" },
    active:   { label: "Active",     className: "bg-blue-50 text-blue-600" },
    complete: { label: "Complete",   className: "bg-green-50 text-green-600" },
    error:    { label: "Error",      className: "bg-red-50 text-red-600" },
  };
  const c = config[status];
  return (
    <span
      className={cn(
        "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
        c.className
      )}
      data-testid={`agent-status-badge-${status}`}
    >
      {c.label}
    </span>
  );
}

function AgentCard({ meta }: { meta: AgentMeta }) {
  const { agents, phase } = useAgentOrchestration();
  const agent = agents[meta.id];
  const Icon = meta.icon;

  const isActive = agent.status === "active";
  const isComplete = agent.status === "complete";
  const isIdle = agent.status === "idle";

  // determine card accent
  const cardClass = isActive
    ? "border-blue-200 bg-blue-50/60"
    : isComplete
    ? "border-green-200 bg-green-50/30"
    : "border-border bg-gray-50/50";

  const iconBg = isActive
    ? "#3B5BDB15"
    : isComplete
    ? "#5F9E6E15"
    : "#f1f5f9";

  const iconColor = isActive ? "#3B5BDB" : isComplete ? "#5F9E6E" : "#94a3b8";

  return (
    <div
      data-testid={`agent-card-${meta.id}`}
      className={cn(
        "p-3 rounded-xl border transition-all duration-400",
        cardClass
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300",
              isActive && "agent-pulse"
            )}
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </div>
          <p className="text-xs font-semibold text-foreground leading-tight">
            {meta.name}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {isComplete && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
          {isIdle && <Clock className="w-3.5 h-3.5 text-gray-400" />}
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 agent-pulse" />
          )}
        </div>
      </div>

      <StatusBadge status={agent.status} />

      {/* Progress bar — shown when active or complete */}
      {(isActive || isComplete) && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Progress</span>
            <span className="text-[10px] font-medium text-foreground">
              {Math.round(agent.progressPercent)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isComplete ? "bg-green-500" : "progress-shimmer"
              )}
              style={{ width: `${agent.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Current task message */}
      {agent.currentTask && (
        <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
          {agent.currentTask}
        </p>
      )}

      {/* Idle fallback description */}
      {isIdle && !agent.currentTask && (
        <p className="mt-1.5 text-[10px] text-muted-foreground/60 leading-relaxed line-clamp-2">
          {meta.description}
        </p>
      )}
    </div>
  );
}

export default function AgentCommandCenter() {
  const { phase, selectedTopic } = useAgentOrchestration();
  const { memory } = useMemorySystem();

  const isOrchestrating = phase !== "idle" && phase !== "complete";
  const hasRun = phase !== "idle";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Agent Command Center
        </h3>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {isOrchestrating
            ? "Agents running..."
            : hasRun
            ? "Sequence complete"
            : "System ready"}
        </p>
      </div>

      {/* Active topic banner */}
      {selectedTopic && (
        <div
          className={cn(
            "mx-3 mt-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
            phase === "complete"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          )}
          data-testid="active-topic-banner"
        >
          <span className="opacity-60 mr-1">Topic:</span>
          {selectedTopic}
        </div>
      )}

      {/* Agent cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {AGENT_META.map((meta) => (
          <AgentCard key={meta.id} meta={meta} />
        ))}
      </div>

      {/* Memory System panel */}
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-border bg-gray-50/60 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Memory System
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Engagement Score</span>
              <span className="text-[10px] font-bold text-foreground">
                {memory.engagementScore}
                <span className="text-muted-foreground font-normal">/100</span>
              </span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${memory.engagementScore}%`,
                  backgroundColor:
                    memory.engagementScore >= 70
                      ? "#5F9E6E"
                      : memory.engagementScore >= 40
                      ? "#f59e0b"
                      : "#ef4444",
                }}
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-muted-foreground">Last Difficulty</span>
              <span
                className="text-[10px] font-semibold capitalize"
                style={{
                  color:
                    memory.lastLessonDifficulty === "advanced"
                      ? "#ef4444"
                      : memory.lastLessonDifficulty === "intermediate"
                      ? "#f59e0b"
                      : memory.lastLessonDifficulty === "beginner"
                      ? "#5F9E6E"
                      : "#94a3b8",
                }}
              >
                {memory.lastLessonDifficulty ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Topics Explored</span>
              <span className="text-[10px] font-bold text-foreground">
                {memory.topicsExplored.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isOrchestrating ? "bg-blue-500 animate-pulse" : "bg-green-400 animate-pulse"
            )}
          />
          <span className="text-[10px] text-muted-foreground">
            {isOrchestrating ? "Processing..." : "System operational"}
          </span>
        </div>
      </div>
    </div>
  );
}
