import { useGetSkills, getGetSkillsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2 } from "lucide-react";

const LEVEL_ORDER = ["novice", "beginner", "intermediate", "advanced", "expert"] as const;

function MasteryBar({ level, percent }: { level: string; percent: number }) {
  const colors: Record<string, string> = {
    novice: "#94a3b8",
    beginner: "#60a5fa",
    intermediate: "#f59e0b",
    advanced: "#5F9E6E",
    expert: "#8b5cf6",
  };
  const color = colors[level] ?? "#3B5BDB";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider capitalize"
          style={{ color }}
        >
          {level}
        </span>
        <span className="text-xs font-bold text-foreground">{Math.round(percent)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function LevelPips({ level }: { level: string }) {
  const idx = LEVEL_ORDER.indexOf(level as (typeof LEVEL_ORDER)[number]);
  return (
    <div className="flex gap-1">
      {LEVEL_ORDER.map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: i <= idx ? "#5F9E6E" : "#e2e8f0",
          }}
        />
      ))}
    </div>
  );
}

export default function SkillsPage() {
  const { data: skills, isLoading } = useGetSkills({
    query: { queryKey: getGetSkillsQueryKey() },
  });

  const grouped = skills?.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <DashboardLayout title="Skills Mastery">
      <div className="space-y-6" data-testid="skills-page">
        <div>
          <p className="text-sm text-muted-foreground">
            Track your mastery across all skill areas. The NeuroAdapt Agent adjusts content to reinforce areas below 50%.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : !grouped || Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <BarChart2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No skills tracked yet</p>
            <p className="text-xs text-muted-foreground mt-1">Complete lessons to start building your skill profile.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, categorySkills]) => (
            <div key={category} data-testid={`skill-category-${category}`}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categorySkills?.map((skill) => (
                  <div
                    key={skill.id}
                    data-testid={`skill-card-${skill.id}`}
                    className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{skill.name}</p>
                        {skill.lastPracticed && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Last practiced: {new Date(skill.lastPracticed).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <LevelPips level={skill.level} />
                    </div>
                    <MasteryBar level={skill.level} percent={skill.masteryLevel} />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
