import { useState } from "react";
import { useGetCurrentLearnerProfile, getGetCurrentLearnerProfileQueryKey } from "@workspace/api-client-react";
import { useAgentOrchestration } from "@/context/agent-orchestration";
import { cn } from "@/lib/utils";
import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOPICS = [
  { id: "photosynthesis", label: "Photosynthesis", emoji: "🌱", category: "Biology" },
  { id: "quantum-mechanics", label: "Quantum Mechanics", emoji: "⚛️", category: "Physics" },
  { id: "french-revolution", label: "The French Revolution", emoji: "🗽", category: "History" },
  { id: "machine-learning", label: "Machine Learning", emoji: "🤖", category: "Computer Science" },
  { id: "climate-change", label: "Climate Change", emoji: "🌍", category: "Earth Science" },
  { id: "human-anatomy", label: "Human Anatomy", emoji: "🫀", category: "Biology" },
  { id: "financial-literacy", label: "Financial Literacy", emoji: "💰", category: "Economics" },
  { id: "ancient-rome", label: "Ancient Rome", emoji: "🏛️", category: "History" },
];

export default function TopicSelector() {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  const { data: profile } = useGetCurrentLearnerProfile({
    query: { queryKey: getGetCurrentLearnerProfileQueryKey() },
  });

  const {
    selectedTopic,
    isOrchestrating,
    phase,
    resetOrchestration,
    triggerOrchestration,
  } = useAgentOrchestration();

  const handleSelect = (topicLabel: string) => {
    if (isOrchestrating) return;
    if (!profile) return;
    triggerOrchestration(
      topicLabel,
      profile.learningStyle,
      profile.neurodivergentProfile
    );
  };

  const phaseLabel: Record<string, string> = {
    profiling: "Profiling your learning style...",
    planning: "Building your roadmap...",
    neuroadapting: "Adapting content to your profile...",
    observing: "Calibrating engagement tracking...",
    complete: "Your roadmap is ready",
  };

  return (
    <div className="space-y-4" data-testid="topic-selector">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Explore a Topic</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a topic — the agent system will build a custom learning roadmap for you.
          </p>
        </div>
        {(phase === "complete" || selectedTopic) && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 flex-shrink-0"
            onClick={resetOrchestration}
            data-testid="button-reset-orchestration"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Active orchestration status bar */}
      {isOrchestrating && phase !== "idle" && (
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50"
          data-testid="orchestration-status-bar"
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
                style={{ animation: `agent-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-blue-700">
            {phaseLabel[phase] ?? "Orchestrating..."}
          </span>
        </div>
      )}

      {/* Topic grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="topic-grid">
        {TOPICS.map((topic) => {
          const isSelected = selectedTopic === topic.label;
          const isDisabled = isOrchestrating && !isSelected;

          return (
            <button
              key={topic.id}
              data-testid={`topic-${topic.id}`}
              onClick={() => handleSelect(topic.label)}
              disabled={isDisabled}
              onMouseEnter={() => setHoveredTopic(topic.id)}
              onMouseLeave={() => setHoveredTopic(null)}
              className={cn(
                "relative text-left px-3 py-3 rounded-xl border-2 transition-all duration-200",
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : isDisabled
                  ? "border-border bg-gray-50 opacity-50 cursor-not-allowed"
                  : hoveredTopic === topic.id
                  ? "border-blue-300 bg-blue-50/50 cursor-pointer"
                  : "border-border bg-white hover:border-blue-200 cursor-pointer"
              )}
            >
              <span className="text-xl mb-1.5 block">{topic.emoji}</span>
              <p className="text-xs font-semibold text-foreground leading-tight">{topic.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{topic.category}</p>

              {/* Selected pulse ring */}
              {isSelected && isOrchestrating && (
                <div className="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping opacity-30 pointer-events-none" />
              )}

              {isSelected && phase === "complete" && (
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!profile && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Complete onboarding to unlock topic selection.
        </p>
      )}
    </div>
  );
}
