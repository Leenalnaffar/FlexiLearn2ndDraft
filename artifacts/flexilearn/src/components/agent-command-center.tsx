import { Brain, Map, Zap, Eye, RefreshCw, TrendingUp, CheckCircle, Clock, type LucideIcon } from "lucide-react";
import { useFlexiLearnStore, type AgentId } from "@/store";
import { cn } from "@/lib/utils";

interface AgentMeta {
  id: AgentId;
  name: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}

const AGENT_META: AgentMeta[] = [
  {
    id: "profiling",
    name: "Profiling Agent",
    description: "Analyses your learning style and cognitive profile to personalise all content.",
    icon: Brain,
    phase: "PROFILE",
  },
  {
    id: "planning",
    name: "Planning Agent",
    description: "Breaks down your question into learning objectives and selects teaching strategy.",
    icon: Map,
    phase: "PLAN",
  },
  {
    id: "content",
    name: "Content Agent",
    description: "Generates adaptive lesson content, explanations, and examples via AI.",
    icon: TrendingUp,
    phase: "ACT",
  },
  {
    id: "neuroadapt",
    name: "NeuroAdapt Agent",
    description: "Formats content to match your neuro-cognitive profile and accessibility needs.",
    icon: Zap,
    phase: "ADAPT",
  },
  {
    id: "observation",
    name: "Observation Agent",
    description: "Monitors engagement patterns and tracks topic interactions in real time.",
    icon: Eye,
    phase: "OBSERVE",
  },
  {
    id: "reflection",
    name: "Reflection Agent",
    description: "Evaluates response quality and adjusts strategy for future interactions.",
    icon: RefreshCw,
    phase: "REFLECT",
  },
];

function AgentCard({ meta }: { meta: AgentMeta }) {
  const agents = useFlexiLearnStore((s) => s.agents);
  const agent = agents[meta.id];
  const Icon = meta.icon;

  const isActive = agent.status === "active";
  const isComplete = agent.status === "complete";
  const isIdle = agent.status === "idle";

  const cardClass = isActive
    ? "border-blue-200 bg-blue-50/60"
    : isComplete
    ? "border-green-200 bg-green-50/30"
    : "border-border bg-gray-50/30";

  const iconBg = isActive ? "#3B5BDB20" : isComplete ? "#22c55e20" : "#f1f5f9";
  const iconColor = isActive ? "#3B5BDB" : isComplete ? "#15803d" : "#94a3b8";

  const phaseBg = isActive ? "#3B5BDB10" : isComplete ? "#22c55e10" : "#f1f5f9";
  const phaseColor = isActive ? "#3B5BDB" : isComplete ? "#15803d" : "#94a3b8";

  return (
    <div
      data-testid={`agent-card-${meta.id}`}
      className={cn("p-3 rounded-xl border transition-all duration-300", cardClass)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", isActive && "agent-pulse")}
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">{meta.name}</p>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: phaseBg, color: phaseColor }}>
              {meta.phase}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          {isComplete && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
          {isIdle && <Clock className="w-3.5 h-3.5 text-gray-300" />}
          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
        </div>
      </div>

      {(isActive || isComplete) && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground capitalize">{agent.status}</span>
            <span className="text-[10px] font-bold text-foreground">{Math.round(agent.progressPercent)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", isComplete ? "bg-green-500" : "progress-shimmer")}
              style={{ width: `${agent.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {agent.currentTask && (
        <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{agent.currentTask}</p>
      )}

      {isIdle && !agent.currentTask && (
        <p className="mt-1 text-[10px] text-muted-foreground/50 leading-relaxed line-clamp-2">{meta.description}</p>
      )}
    </div>
  );
}

export default function AgentCommandCenter() {
  const agents = useFlexiLearnStore((s) => s.agents);
  const engagementScore = useFlexiLearnStore((s) => s.engagementScore);
  const topicMastery = useFlexiLearnStore((s) => s.topicMastery);
  const sessionInteractions = useFlexiLearnStore((s) => s.sessionInteractions);

  const activeCount = Object.values(agents).filter((a) => a.status === "active").length;
  const completeCount = Object.values(agents).filter((a) => a.status === "complete").length;
  const isOrchestrating = activeCount > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Agent Command Center
        </h3>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {isOrchestrating
            ? `${activeCount} agent${activeCount !== 1 ? "s" : ""} working...`
            : completeCount > 0
            ? `Sequence complete · ${completeCount}/6 done`
            : "System ready"}
        </p>
      </div>

      {isOrchestrating && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <span className="opacity-60 mr-1">Active:</span>
          {Object.entries(agents)
            .filter(([, a]) => a.status === "active")
            .map(([id]) => AGENT_META.find((m) => m.id === id)?.name)
            .filter(Boolean)
            .join(", ")}
        </div>
      )}

      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {AGENT_META.map((meta) => (
          <AgentCard key={meta.id} meta={meta} />
        ))}
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-xl border border-border bg-gray-50/60 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Memory System
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Engagement Score</span>
              <span className="text-[10px] font-bold text-foreground">
                {engagementScore}<span className="text-muted-foreground font-normal">/100</span>
              </span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${engagementScore}%`,
                  backgroundColor: engagementScore >= 70 ? "#22c55e" : engagementScore >= 40 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-muted-foreground">Questions Asked</span>
              <span className="text-[10px] font-bold text-foreground">{sessionInteractions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Topics Tracked</span>
              <span className="text-[10px] font-bold text-foreground">{Object.keys(topicMastery).length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", isOrchestrating ? "bg-blue-500 animate-pulse" : "bg-green-400 animate-pulse")} />
          <span className="text-[10px] text-muted-foreground">
            {isOrchestrating ? "Orchestrating..." : "System operational"}
          </span>
        </div>
      </div>
    </div>
  );
}
