import { useGetLearningPaths, getGetLearningPathsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    beginner: "#5F9E6E",
    intermediate: "#f59e0b",
    advanced: "#ef4444",
  };
  const color = colors[difficulty] ?? "#94a3b8";
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {difficulty}
    </span>
  );
}

export default function LearningPathPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: paths, isLoading } = useGetLearningPaths({
    query: { queryKey: getGetLearningPathsQueryKey() },
  });

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <DashboardLayout title="My Learning Path">
      <div className="space-y-5" data-testid="learning-path-page">
        <div>
          <p className="text-sm text-muted-foreground">
            Your personalized learning paths, curated by the Planning Agent based on your profile.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : paths?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No learning paths yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your paths will appear here once configured.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paths?.map((path) => (
              <div
                key={path.id}
                data-testid={`path-card-${path.id}`}
                className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-sm transition-shadow"
              >
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {path.category}
                        </span>
                        <DifficultyBadge difficulty={path.difficulty} />
                        {path.isActive && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            Active
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground">{path.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{path.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{path.estimatedHours}h</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="text-xs">{path.totalLessons} lessons</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {path.completedLessons} of {path.totalLessons} lessons completed
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {Math.round(path.progressPercent)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${path.progressPercent}%`,
                          backgroundColor:
                            path.progressPercent === 100 ? "#22c55e" : "#5F9E6E",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Lessons toggle */}
                {path.lessons && path.lessons.length > 0 && (
                  <>
                    <button
                      data-testid={`toggle-lessons-${path.id}`}
                      onClick={() => toggleExpand(path.id)}
                      className="w-full flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="font-medium">
                        {expanded === path.id ? "Hide lessons" : `Show ${path.lessons.length} lessons`}
                      </span>
                      {expanded === path.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expanded === path.id && (
                      <div className="border-t border-border divide-y divide-border">
                        {path.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            data-testid={`lesson-item-${lesson.id}`}
                            className={cn(
                              "flex items-center gap-3 px-5 py-3",
                              lesson.isCompleted ? "bg-green-50/40" : "bg-white"
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                                lesson.isCompleted
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-gray-300 text-gray-400"
                              )}
                            >
                              {lesson.isCompleted ? "✓" : lesson.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{lesson.title}</p>
                              <p className="text-[10px] text-muted-foreground">{lesson.durationMinutes} min</p>
                            </div>
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
                              style={{
                                backgroundColor:
                                  lesson.type === "video" ? "#6366f115" :
                                  lesson.type === "reading" ? "#0ea5e915" :
                                  lesson.type === "interactive" ? "#f59e0b15" :
                                  "#5F9E6E15",
                                color:
                                  lesson.type === "video" ? "#6366f1" :
                                  lesson.type === "reading" ? "#0ea5e9" :
                                  lesson.type === "interactive" ? "#f59e0b" :
                                  "#5F9E6E",
                              }}
                            >
                              {lesson.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
