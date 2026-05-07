import { useLocation } from "wouter";
import {
  useGetCurrentLearnerProfile,
  useGetProgressSummary,
  useGetLearningPaths,
  useGetLesson,
  getGetCurrentLearnerProfileQueryKey,
  getGetProgressSummaryQueryKey,
  getGetLearningPathsQueryKey,
  getGetLessonQueryKey,
} from "@workspace/api-client-react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Flame, Target, TrendingUp, Clock, ChevronRight, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-start gap-3" data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function LessonTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; color: string }> = {
    video: { label: "Video", color: "#6366f1" },
    reading: { label: "Reading", color: "#0ea5e9" },
    interactive: { label: "Interactive", color: "#f59e0b" },
    quiz: { label: "Quiz", color: "#ec4899" },
    project: { label: "Project", color: "#5F9E6E" },
  };
  const c = config[type] ?? { label: type, color: "#94a3b8" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: `${c.color}15`, color: c.color }}
    >
      {c.label}
    </span>
  );
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = useGetCurrentLearnerProfile({
    query: { queryKey: getGetCurrentLearnerProfileQueryKey() },
  });

  const { data: summary, isLoading: summaryLoading } = useGetProgressSummary({
    query: { queryKey: getGetProgressSummaryQueryKey() },
  });

  const { data: paths, isLoading: pathsLoading } = useGetLearningPaths({
    query: { queryKey: getGetLearningPathsQueryKey() },
  });

  const { data: featuredLesson } = useGetLesson(1, {
    query: { enabled: true, queryKey: getGetLessonQueryKey(1) },
  });

  useEffect(() => {
    if (!profileLoading && !profile) {
      setLocation("/onboarding");
    }
  }, [profile, profileLoading, setLocation]);

  const isLoading = summaryLoading || pathsLoading;

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6" data-testid="dashboard-content">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {profileLoading ? (
              <Skeleton className="h-7 w-48" />
            ) : profile ? (
              <>Welcome back, {profile.displayName}</>
            ) : (
              "Your Learning Dashboard"
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Here is where your learning journey continues.</p>
        </div>

        {/* Stats Row */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="stats-grid">
            <StatCard label="Lessons Completed" value={summary.totalLessonsCompleted} icon={BookOpen} color="#3B5BDB" />
            <StatCard label="Day Streak" value={`${summary.currentStreak}d`} icon={Flame} color="#f59e0b" />
            <StatCard label="Weekly Goal" value={`${Math.round(summary.weeklyGoalPercent)}%`} icon={Target} color="#5F9E6E" />
            <StatCard label="Skills Improved" value={summary.skillsImprovedThisWeek} icon={TrendingUp} color="#8b5cf6" />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Learning Paths — 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Active Learning Paths</h3>
              <button
                onClick={() => setLocation("/learning-path")}
                className="text-xs font-medium flex items-center gap-0.5"
                style={{ color: "#3B5BDB" }}
                data-testid="link-view-all-paths"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pathsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : paths?.slice(0, 3).map((path) => (
              <div
                key={path.id}
                data-testid={`path-card-${path.id}`}
                className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setLocation("/learning-path")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{path.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{path.category}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{path.estimatedHours}h</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize ml-1"
                    >
                      {path.difficulty}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      {path.completedLessons} / {path.totalLessons} lessons
                    </span>
                    <span className="text-xs font-medium text-foreground">{Math.round(path.progressPercent)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${path.progressPercent}%`,
                        backgroundColor: path.progressPercent === 100 ? "#22c55e" : "#5F9E6E",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right column — Featured Lesson + Activity */}
          <div className="lg:col-span-2 space-y-4">
            {/* Featured Lesson */}
            {featuredLesson && (
              <div className="bg-white rounded-xl border border-border p-4" data-testid="featured-lesson">
                <div className="flex items-center gap-1.5 mb-3">
                  <Award className="w-3.5 h-3.5" style={{ color: "#3B5BDB" }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#3B5BDB" }}>
                    Featured Lesson
                  </span>
                </div>
                <LessonTypeBadge type={featuredLesson.type} />
                <h4 className="text-sm font-bold text-foreground mt-2 mb-1">{featuredLesson.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                  {featuredLesson.description}
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{featuredLesson.durationMinutes} min</span>
                  {featuredLesson.isCompleted && (
                    <span className="text-xs font-medium" style={{ color: "#5F9E6E" }}>Completed</span>
                  )}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {summary && summary.recentActivity.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-4" data-testid="recent-activity">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {summary.recentActivity.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{
                          backgroundColor:
                            item.type === "lesson_complete"
                              ? "#5F9E6E"
                              : item.type === "skill_leveled"
                              ? "#8b5cf6"
                              : item.type === "path_started"
                              ? "#3B5BDB"
                              : "#f59e0b",
                        }}
                      />
                      <p className="text-xs text-foreground leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
