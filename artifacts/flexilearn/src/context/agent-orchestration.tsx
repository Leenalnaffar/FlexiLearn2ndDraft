import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useMemorySystem, type MemorySystem } from "@/hooks/use-memory-system";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type AgentStatus = "idle" | "active" | "complete" | "error";

export interface AgentState {
  status: AgentStatus;
  progressPercent: number;
  currentTask: string | null;
  lastUpdated: Date;
}

export interface RoadmapStep {
  id: number;
  title: string;
  type: "reading" | "video" | "interactive" | "quiz" | "project";
  durationMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  neuroAdapted: boolean;
}

export interface LearningRoadmap {
  topic: string;
  learnerType: string;
  neuroProfile: string;
  engagementScore: number;
  steps: RoadmapStep[];
  generatedAt: Date;
}

export type OrchestratorPhase =
  | "idle"
  | "profiling"
  | "planning"
  | "neuroadapting"
  | "observing"
  | "complete";

interface AgentOrchestrationState {
  phase: OrchestratorPhase;
  agents: Record<string, AgentState>;
  roadmap: LearningRoadmap | null;
  selectedTopic: string | null;
  memory: MemorySystem;
  isOrchestrating: boolean;
}

interface AgentOrchestrationContextValue extends AgentOrchestrationState {
  triggerOrchestration: (
    topic: string,
    learnerStyle: string,
    neuroProfile: string
  ) => void;
  resetOrchestration: () => void;
  recordLessonCompleted: (difficulty: MemorySystem["lastLessonDifficulty"]) => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const INITIAL_AGENTS: Record<string, AgentState> = {
  profiling: {
    status: "idle",
    progressPercent: 0,
    currentTask: null,
    lastUpdated: new Date(),
  },
  planning: {
    status: "idle",
    progressPercent: 0,
    currentTask: null,
    lastUpdated: new Date(),
  },
  neuroadapt: {
    status: "idle",
    progressPercent: 0,
    currentTask: null,
    lastUpdated: new Date(),
  },
  observation: {
    status: "idle",
    progressPercent: 0,
    currentTask: null,
    lastUpdated: new Date(),
  },
};

function formatLearnerStyle(style: string): string {
  const map: Record<string, string> = {
    visual: "Visual Learner",
    auditory: "Auditory Learner",
    kinesthetic: "Kinesthetic Learner",
    reading_writing: "Reading/Writing Learner",
  };
  return map[style] ?? style;
}

function formatNeuroProfile(profile: string): string {
  const map: Record<string, string> = {
    none: "Standard",
    adhd: "ADHD",
    dyslexia: "Dyslexia",
    autism: "Autism",
  };
  return map[profile] ?? profile;
}

function generateRoadmap(
  topic: string,
  learnerStyle: string,
  neuroProfile: string,
  engagementScore: number
): LearningRoadmap {
  const isDyslexia = neuroProfile === "dyslexia";
  const isAdhd = neuroProfile === "adhd";
  const isAutism = neuroProfile === "autism";
  const isVisual = learnerStyle === "visual";
  const isKinesthetic = learnerStyle === "kinesthetic";

  const pickType = (
    preferred: RoadmapStep["type"],
    fallback: RoadmapStep["type"]
  ): RoadmapStep["type"] => {
    if (isKinesthetic) return "interactive";
    return preferred;
  };

  const difficulty =
    engagementScore >= 80
      ? "intermediate"
      : engagementScore >= 50
      ? "beginner"
      : "beginner";

  const steps: RoadmapStep[] = [
    {
      id: 1,
      title: `Introduction to ${topic}`,
      type: isVisual ? "video" : pickType("reading", "reading"),
      durationMinutes: isAdhd ? 5 : 10,
      difficulty: "beginner",
      neuroAdapted: neuroProfile !== "none",
    },
    {
      id: 2,
      title: `Core Concepts: ${topic} Fundamentals`,
      type: isVisual ? "interactive" : pickType("reading", "interactive"),
      durationMinutes: isAdhd ? 8 : 15,
      difficulty: "beginner",
      neuroAdapted: neuroProfile !== "none",
    },
    {
      id: 3,
      title: `Deep Dive: ${topic} in Action`,
      type: isVisual ? "video" : "interactive",
      durationMinutes: isAdhd ? 10 : 20,
      difficulty,
      neuroAdapted: neuroProfile !== "none",
    },
    {
      id: 4,
      title: `Practice: ${topic} Quiz`,
      type: "quiz",
      durationMinutes: isAdhd ? 7 : 12,
      difficulty,
      neuroAdapted: neuroProfile !== "none",
    },
    {
      id: 5,
      title: `Capstone: Apply ${topic} to Real Life`,
      type: "project",
      durationMinutes: isAdhd ? 12 : 25,
      difficulty: "advanced",
      neuroAdapted: neuroProfile !== "none",
    },
  ];

  return {
    topic,
    learnerType: formatLearnerStyle(learnerStyle),
    neuroProfile: formatNeuroProfile(neuroProfile),
    engagementScore,
    steps,
    generatedAt: new Date(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const AgentOrchestrationContext =
  createContext<AgentOrchestrationContextValue | null>(null);

export function AgentOrchestrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { memory, recordTopicExplored, recordLessonCompleted } =
    useMemorySystem();

  const [phase, setPhase] = useState<OrchestratorPhase>("idle");
  const [agents, setAgents] =
    useState<Record<string, AgentState>>(INITIAL_AGENTS);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const abortRef = useRef(false);

  const patchAgent = useCallback(
    (id: string, patch: Partial<AgentState>) => {
      setAgents((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch, lastUpdated: new Date() },
      }));
    },
    []
  );

  const resetOrchestration = useCallback(() => {
    abortRef.current = true;
    setPhase("idle");
    setAgents(INITIAL_AGENTS);
    setRoadmap(null);
    setSelectedTopic(null);
  }, []);

  const triggerOrchestration = useCallback(
    async (topic: string, learnerStyle: string, neuroProfile: string) => {
      abortRef.current = false;
      setRoadmap(null);
      setSelectedTopic(topic);
      recordTopicExplored(topic);

      const check = () => abortRef.current;

      // ── Phase 1: Profiling Agent ────────────────────────────
      setPhase("profiling");
      patchAgent("profiling", {
        status: "active",
        progressPercent: 0,
        currentTask: "Reading learner profile...",
      });
      patchAgent("planning", { status: "idle", progressPercent: 0, currentTask: null });
      patchAgent("neuroadapt", { status: "idle", progressPercent: 0, currentTask: null });
      patchAgent("observation", { status: "idle", progressPercent: 0, currentTask: null });

      for (let p = 0; p <= 100; p += 20) {
        if (check()) return;
        patchAgent("profiling", {
          progressPercent: p,
          currentTask:
            p < 40
              ? "Reading learner profile..."
              : p < 80
              ? `Detected: ${formatLearnerStyle(learnerStyle)}`
              : "Profile analysis complete",
        });
        await sleep(180);
      }
      if (check()) return;
      patchAgent("profiling", { status: "complete", progressPercent: 100 });

      await sleep(300);

      // ── Phase 2: Planning Agent ─────────────────────────────
      setPhase("planning");
      patchAgent("planning", {
        status: "active",
        progressPercent: 0,
        currentTask: `Generating custom roadmap for ${formatLearnerStyle(learnerStyle)}...`,
      });

      for (let p = 0; p <= 100; p += 10) {
        if (check()) return;
        patchAgent("planning", {
          progressPercent: p,
          currentTask:
            p < 30
              ? `Generating custom roadmap for ${formatLearnerStyle(learnerStyle)}...`
              : p < 60
              ? `Building 5 micro-steps for "${topic}"...`
              : p < 90
              ? "Calibrating difficulty to engagement score..."
              : "Roadmap ready",
        });
        await sleep(220);
      }
      if (check()) return;

      const newRoadmap = generateRoadmap(
        topic,
        learnerStyle,
        neuroProfile,
        memory.engagementScore
      );
      setRoadmap(newRoadmap);
      patchAgent("planning", { status: "complete", progressPercent: 100 });

      await sleep(300);

      // ── Phase 3: NeuroAdapt Agent ───────────────────────────
      setPhase("neuroadapting");
      const adaptMsg =
        neuroProfile === "dyslexia"
          ? "Formatting text for Dyslexia-friendly spacing..."
          : neuroProfile === "adhd"
          ? "Shortening segments for ADHD attention windows..."
          : neuroProfile === "autism"
          ? "Structuring steps for explicit Autism-friendly flow..."
          : "Applying adaptive formatting...";

      patchAgent("neuroadapt", {
        status: "active",
        progressPercent: 0,
        currentTask: adaptMsg,
      });

      for (let p = 0; p <= 100; p += 25) {
        if (check()) return;
        patchAgent("neuroadapt", {
          progressPercent: p,
          currentTask:
            p < 50
              ? adaptMsg
              : p < 75
              ? "Adjusting pacing and chunking..."
              : "Neuro-adaptation complete",
        });
        await sleep(200);
      }
      if (check()) return;
      patchAgent("neuroadapt", { status: "complete", progressPercent: 100 });

      await sleep(250);

      // ── Phase 4: Observation Agent ──────────────────────────
      setPhase("observing");
      patchAgent("observation", {
        status: "active",
        progressPercent: 0,
        currentTask: "Initialising engagement tracking...",
      });

      for (let p = 0; p <= 100; p += 50) {
        if (check()) return;
        patchAgent("observation", {
          progressPercent: p,
          currentTask:
            p < 50
              ? "Initialising engagement tracking..."
              : "Monitoring session metrics...",
        });
        await sleep(160);
      }
      if (check()) return;
      patchAgent("observation", {
        status: "complete",
        progressPercent: 100,
        currentTask: "Tracking active",
      });

      setPhase("complete");
    },
    [memory.engagementScore, patchAgent, recordTopicExplored]
  );

  return (
    <AgentOrchestrationContext.Provider
      value={{
        phase,
        agents,
        roadmap,
        selectedTopic,
        memory,
        isOrchestrating:
          phase !== "idle" && phase !== "complete",
        triggerOrchestration,
        resetOrchestration,
        recordLessonCompleted,
      }}
    >
      {children}
    </AgentOrchestrationContext.Provider>
  );
}

export function useAgentOrchestration(): AgentOrchestrationContextValue {
  const ctx = useContext(AgentOrchestrationContext);
  if (!ctx) {
    throw new Error(
      "useAgentOrchestration must be used inside AgentOrchestrationProvider"
    );
  }
  return ctx;
}
