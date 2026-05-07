import { useCallback, useEffect, useState } from "react";

export interface MemorySystem {
  lastLessonDifficulty: "beginner" | "intermediate" | "advanced" | null;
  engagementScore: number;
  topicsExplored: string[];
  sessionCount: number;
  lastActive: string | null;
}

const STORAGE_KEY = "flexilearn-memory";

const DEFAULTS: MemorySystem = {
  lastLessonDifficulty: null,
  engagementScore: 72,
  topicsExplored: [],
  sessionCount: 0,
  lastActive: null,
};

function readMemory(): MemorySystem {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function writeMemory(data: MemorySystem): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useMemorySystem() {
  const [memory, setMemoryState] = useState<MemorySystem>(readMemory);

  useEffect(() => {
    const updated = {
      ...memory,
      sessionCount: memory.sessionCount + 1,
      lastActive: new Date().toISOString(),
    };
    writeMemory(updated);
    setMemoryState(updated);
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMemory = useCallback((patch: Partial<MemorySystem>) => {
    setMemoryState((prev) => {
      const next = { ...prev, ...patch };
      writeMemory(next);
      return next;
    });
  }, []);

  const recordTopicExplored = useCallback((topic: string) => {
    setMemoryState((prev) => {
      const topics = prev.topicsExplored.includes(topic)
        ? prev.topicsExplored
        : [topic, ...prev.topicsExplored].slice(0, 20);
      const next = { ...prev, topicsExplored: topics };
      writeMemory(next);
      return next;
    });
  }, []);

  const recordLessonCompleted = useCallback(
    (difficulty: MemorySystem["lastLessonDifficulty"]) => {
      setMemoryState((prev) => {
        const bump = difficulty === "advanced" ? 5 : difficulty === "intermediate" ? 3 : 1;
        const next = {
          ...prev,
          lastLessonDifficulty: difficulty,
          engagementScore: Math.min(100, prev.engagementScore + bump),
        };
        writeMemory(next);
        return next;
      });
    },
    []
  );

  return { memory, updateMemory, recordTopicExplored, recordLessonCompleted };
}
