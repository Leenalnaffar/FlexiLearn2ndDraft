import { useAgentOrchestration, type RoadmapStep } from "@/context/agent-orchestration";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, BookOpen, Video, Zap, HelpCircle, Wrench } from "lucide-react";
import { useCallback } from "react";

function TypeIcon({ type }: { type: RoadmapStep["type"] }) {
  const map: Record<RoadmapStep["type"], React.ComponentType<{ className?: string }>> = {
    reading: BookOpen,
    video: Video,
    interactive: Zap,
    quiz: HelpCircle,
    project: Wrench,
  };
  const Icon = map[type];
  return <Icon className="w-3 h-3" />;
}

function TypeBadge({ type }: { type: RoadmapStep["type"] }) {
  const config: Record<RoadmapStep["type"], { label: string; color: string }> = {
    reading:     { label: "Reading",     color: "#0ea5e9" },
    video:       { label: "Video",       color: "#6366f1" },
    interactive: { label: "Interactive", color: "#f59e0b" },
    quiz:        { label: "Quiz",        color: "#ec4899" },
    project:     { label: "Project",     color: "#5F9E6E" },
  };
  const c = config[type];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: `${c.color}15`, color: c.color }}
    >
      <TypeIcon type={type} />
      {c.label}
    </span>
  );
}

function DifficultyDot({ difficulty }: { difficulty: RoadmapStep["difficulty"] }) {
  const colors: Record<RoadmapStep["difficulty"], string> = {
    beginner: "#5F9E6E",
    intermediate: "#f59e0b",
    advanced: "#ef4444",
  };
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: colors[difficulty] }}
      title={difficulty}
    />
  );
}

export default function LearningRoadmap() {
  const { roadmap, phase, recordLessonCompleted } = useAgentOrchestration();

  const handleMarkComplete = useCallback(
    (difficulty: RoadmapStep["difficulty"]) => {
      recordLessonCompleted(difficulty);
    },
    [recordLessonCompleted]
  );

  if (phase === "idle" || (!roadmap && phase !== "complete")) return null;

  // Show skeleton while orchestrating
  if (!roadmap) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5 space-y-3 animate-pulse" data-testid="roadmap-skeleton">
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-gray-50 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden" data-testid="learning-roadmap">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-border"
        style={{ background: "linear-gradient(135deg, #3B5BDB08 0%, #5F9E6E08 100%)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#3B5BDB15", color: "#3B5BDB" }}
              >
                Agent-Generated Roadmap
              </span>
              {roadmap.neuroProfile !== "Standard" && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#5F9E6E15", color: "#5F9E6E" }}
                >
                  NeuroAdapted
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-foreground">{roadmap.topic}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roadmap.learnerType}
              {roadmap.neuroProfile !== "Standard" ? ` · ${roadmap.neuroProfile} Mode` : ""}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">Engagement</p>
            <p
              className="text-lg font-bold"
              style={{ color: roadmap.engagementScore >= 70 ? "#5F9E6E" : "#f59e0b" }}
            >
              {roadmap.engagementScore}
              <span className="text-xs font-normal text-muted-foreground">/100</span>
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {roadmap.steps.map((step, idx) => (
          <div
            key={step.id}
            data-testid={`roadmap-step-${step.id}`}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group"
          >
            {/* Step number */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ backgroundColor: "#3B5BDB" }}
            >
              {idx + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-foreground truncate">{step.title}</p>
                {step.neuroAdapted && (
                  <span
                    className="text-[9px] font-semibold px-1.5 py-px rounded flex-shrink-0"
                    style={{ backgroundColor: "#5F9E6E15", color: "#5F9E6E" }}
                  >
                    adapted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TypeBadge type={step.type} />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  <span className="text-[10px]">{step.durationMinutes} min</span>
                </div>
                <DifficultyDot difficulty={step.difficulty} />
                <span className="text-[10px] text-muted-foreground capitalize">{step.difficulty}</span>
              </div>
            </div>

            {/* Mark complete button */}
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-green-600 flex-shrink-0"
              onClick={() => handleMarkComplete(step.difficulty)}
              data-testid={`mark-complete-step-${step.id}`}
              title="Mark as completed"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-gray-50/40 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {roadmap.steps.length} micro-steps ·{" "}
          {roadmap.steps.reduce((sum, s) => sum + s.durationMinutes, 0)} min total
        </p>
        <p className="text-[10px] text-muted-foreground">
          Generated {new Date(roadmap.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
