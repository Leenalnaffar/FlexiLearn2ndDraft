import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AgentId = "profiling" | "planning" | "content" | "neuroadapt" | "observation" | "reflection";

export interface AgentState {
  status: "idle" | "active" | "complete" | "error";
  progressPercent: number;
  currentTask: string | null;
  lastDecision: string | null;
  output: string | null;
}

export interface TopicMastery {
  topic: string;
  subject: string;
  score: number;
  interactions: number;
  lastStudied: string;
}

export interface AccessibilitySettings {
  fontSize: number;
  lineSpacing: number;
  highContrast: boolean;
  reduceMotion: boolean;
  dyslexicFont: boolean;
  focusMode: boolean;
  theme: "default" | "sepia" | "high-contrast";
}

export interface FlexiLearnProfile {
  displayName: string;
  learningStyle: string;
  neuroProfile: string;
}

export interface InteractionEntry {
  question: string;
  timestamp: string;
  topics: string[];
}

export interface ProfileOverride {
  learningStyle: string;
  neuroProfile: string;
}

const idleAgent = (): AgentState => ({
  status: "idle",
  progressPercent: 0,
  currentTask: null,
  lastDecision: null,
  output: null,
});

const defaultAgents = (): Record<AgentId, AgentState> => ({
  profiling: idleAgent(),
  planning: idleAgent(),
  content: idleAgent(),
  neuroadapt: idleAgent(),
  observation: idleAgent(),
  reflection: idleAgent(),
});

const defaultAccessibility = (): AccessibilitySettings => ({
  fontSize: 16,
  lineSpacing: 1.6,
  highContrast: false,
  reduceMotion: false,
  dyslexicFont: false,
  focusMode: false,
  theme: "default",
});

interface FlexiLearnStore {
  profile: FlexiLearnProfile | null;
  profileOverride: ProfileOverride | null;
  topicMastery: Record<string, TopicMastery>;
  engagementScore: number;
  sessionInteractions: number;
  xp: number;
  currentConversationId: number | null;
  agents: Record<AgentId, AgentState>;
  accessibility: AccessibilitySettings;
  interactionHistory: InteractionEntry[];

  setProfile: (profile: FlexiLearnProfile | null) => void;
  setProfileOverride: (override: ProfileOverride | null) => void;
  getActiveStyle: () => string;
  getActiveNeuro: () => string;
  recordTopicInteraction: (topic: string, subject: string, scoreBoost: number) => void;
  updateAgent: (id: AgentId, patch: Partial<AgentState>) => void;
  resetAgents: () => void;
  setConversationId: (id: number | null) => void;
  addInteraction: (question: string, topics: string[]) => void;
  incrementEngagement: (amount?: number) => void;
  addXP: (amount: number) => void;
  setAccessibility: (patch: Partial<AccessibilitySettings>) => void;
  getWeakTopics: () => TopicMastery[];
  getMasteredTopics: () => TopicMastery[];
  clearTopics: () => void;
  resetForNewUser: () => void;
}

export const useFlexiLearnStore = create<FlexiLearnStore>()(
  persist(
    (set, get) => ({
      profile: null,
      profileOverride: null,
      topicMastery: {},
      engagementScore: 0,
      sessionInteractions: 0,
      xp: 0,
      currentConversationId: null,
      agents: defaultAgents(),
      accessibility: defaultAccessibility(),
      interactionHistory: [],

      setProfile: (profile) => set({ profile }),

      setProfileOverride: (override) => set({ profileOverride: override }),

      getActiveStyle: () => {
        const s = get();
        return s.profileOverride?.learningStyle ?? s.profile?.learningStyle ?? "reading_writing";
      },

      getActiveNeuro: () => {
        const s = get();
        return s.profileOverride?.neuroProfile ?? s.profile?.neuroProfile ?? "none";
      },

      recordTopicInteraction: (topic, subject, scoreBoost) => {
        const current = get().topicMastery;
        const existing = current[topic] ?? {
          topic,
          subject,
          score: 0,
          interactions: 0,
          lastStudied: new Date().toISOString(),
        };
        const newScore = Math.min(100, existing.score + scoreBoost);
        set({
          topicMastery: {
            ...current,
            [topic]: {
              ...existing,
              score: newScore,
              interactions: existing.interactions + 1,
              lastStudied: new Date().toISOString(),
            },
          },
        });
      },

      updateAgent: (id, patch) => {
        const current = get().agents;
        set({ agents: { ...current, [id]: { ...current[id], ...patch } } });
      },

      resetAgents: () => set({ agents: defaultAgents() }),

      setConversationId: (id) => set({ currentConversationId: id }),

      addInteraction: (question, topics) => {
        const history = get().interactionHistory;
        set({
          interactionHistory: [
            ...history.slice(-49),
            { question, timestamp: new Date().toISOString(), topics },
          ],
          sessionInteractions: get().sessionInteractions + 1,
        });
      },

      incrementEngagement: (amount = 5) => {
        set({ engagementScore: Math.min(100, get().engagementScore + amount) });
      },

      addXP: (amount) => {
        set({ xp: get().xp + amount });
      },

      setAccessibility: (patch) => {
        set({ accessibility: { ...get().accessibility, ...patch } });
      },

      getWeakTopics: () => {
        return Object.values(get().topicMastery)
          .filter((t) => t.score < 40)
          .sort((a, b) => a.score - b.score);
      },

      getMasteredTopics: () => {
        return Object.values(get().topicMastery)
          .filter((t) => t.score >= 75)
          .sort((a, b) => b.score - a.score);
      },

      clearTopics: () => set({ topicMastery: {}, interactionHistory: [], engagementScore: 0, sessionInteractions: 0 }),

      resetForNewUser: () => set({
        profile: null,
        profileOverride: null,
        topicMastery: {},
        engagementScore: 0,
        sessionInteractions: 0,
        xp: 0,
        currentConversationId: null,
        agents: defaultAgents(),
        interactionHistory: [],
        accessibility: defaultAccessibility(),
      }),
    }),
    {
      name: "flexilearn-store-v3",
      partialize: (state) => ({
        profile: state.profile,
        topicMastery: state.topicMastery,
        engagementScore: state.engagementScore,
        interactionHistory: state.interactionHistory,
        accessibility: state.accessibility,
        currentConversationId: state.currentConversationId,
        xp: state.xp,
      }),
    }
  )
);
