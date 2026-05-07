import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Target, TrendingUp, AlertCircle, CheckCircle, ChevronRight, BookOpen } from "lucide-react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useFlexiLearnStore } from "@/store";
import { cn } from "@/lib/utils";

function getMasteryConfig(score: number): { label: string; color: string; bgColor: string; barColor: string } {
  if (score >= 80) return { label: "Expert", color: "#15803d", bgColor: "#dcfce7", barColor: "#22c55e" };
  if (score >= 65) return { label: "Advanced", color: "#1d4ed8", bgColor: "#dbeafe", barColor: "#3B5BDB" };
  if (score >= 45) return { label: "Intermediate", color: "#6d28d9", bgColor: "#ede9fe", barColor: "#8b5cf6" };
  if (score >= 25) return { label: "Beginner", color: "#b45309", bgColor: "#fef3c7", barColor: "#f59e0b" };
  return { label: "Novice", color: "#dc2626", bgColor: "#fee2e2", barColor: "#ef4444" };
}

function SkillCard({ topic, score, subject, interactions, lastStudied }: {
  topic: string; score: number; subject: string; interactions: number; lastStudied: string;
}) {
  const config = getMasteryConfig(score);
  const lastDate = new Date(lastStudied);
  const isToday = new Date().toDateString() === lastDate.toDateString();
  const timeAgo = isToday ? "Today" : lastDate.toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bgColor }}>
            <Target className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{topic}</p>
            <p className="text-xs text-muted-foreground">{subject}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-bold" style={{ color: config.color }}>{score}%</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bgColor, color: config.color }}>
            {config.label}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: config.barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{interactions} interaction{interactions !== 1 ? "s" : ""}</span>
        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
      </div>
    </motion.div>
  );
}

export default function SkillsPage() {
  const [, setLocation] = useLocation();
  const store = useFlexiLearnStore();
  const { topicMastery, profile } = store;

  const topics = Object.values(topicMastery);
  const weakTopics = store.getWeakTopics();
  const masteredTopics = store.getMasteredTopics();

  const profileLabel = profile
    ? `${profile.learningStyle?.replace("_", "/")} · ${profile.neuroProfile === "none" ? "Standard" : profile.neuroProfile}`
    : null;

  const subjectGroups: Record<string, typeof topics> = {};
  topics.forEach((t) => {
    if (!subjectGroups[t.subject]) subjectGroups[t.subject] = [];
    subjectGroups[t.subject].push(t);
  });

  return (
    <DashboardLayout title="Skills Mastery">
      <div className="space-y-6" data-testid="skills-page">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Skills Mastery</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Academic topics tracked from your learning sessions — built dynamically from your interactions.
              {profileLabel && (
                <span className="ml-1 text-blue-600">Active profile: {profileLabel}.</span>
              )}
            </p>
            {profile?.neuroProfile === "none" && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 mt-2 inline-block">
                Standard Mode — showing academic topics only, no generic content.
              </p>
            )}
          </div>
          {topics.length > 0 && (
            <button
              onClick={() => setLocation("/workspace")}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all text-white flex-shrink-0"
              style={{ backgroundColor: "#3B5BDB" }}
            >
              Study more <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#3B5BDB15" }}>
              <BookOpen className="w-7 h-7" style={{ color: "#3B5BDB" }} />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">No topics tracked yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-2">
              Your Skills Mastery updates automatically from your study sessions.
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mb-6">
              Ask about Biology, Mathematics, History, or any academic subject in the Agent Workspace — your skills will appear here automatically. No hardcoded content, no unrelated strategies.
            </p>
            <button
              onClick={() => setLocation("/workspace")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: "#3B5BDB" }}
            >
              Open Agent Workspace <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Topics", value: topics.length, icon: Target, color: "#3B5BDB" },
                { label: "Needs Focus", value: weakTopics.length, icon: AlertCircle, color: "#f59e0b" },
                { label: "Mastered", value: masteredTopics.length, icon: CheckCircle, color: "#22c55e" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {weakTopics.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-4 h-4" /> Topics Needing More Practice
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {weakTopics.map((t) => (
                    <button key={t.topic} onClick={() => setLocation("/workspace")}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium border border-amber-300 bg-white text-amber-800 hover:bg-amber-100 transition-colors">
                      {t.topic} — {t.score}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {masteredTopics.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-green-800 flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-4 h-4" /> Mastered Topics
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {masteredTopics.map((t) => (
                    <span key={t.topic} className="text-xs px-2.5 py-1 rounded-lg font-medium bg-white border border-green-300 text-green-800">
                      {t.topic} — {t.score}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.entries(subjectGroups)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([subject, subTopics]) => {
                const avg = Math.round(subTopics.reduce((s, t) => s + t.score, 0) / subTopics.length);
                const config = getMasteryConfig(avg);
                return (
                  <div key={subject}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bgColor }}>
                          <TrendingUp className="w-3.5 h-3.5" style={{ color: config.color }} />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">{subject}</h3>
                        <span className="text-xs text-muted-foreground">
                          ({subTopics.length} topic{subTopics.length !== 1 ? "s" : ""} · avg {avg}%)
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full")} style={{ backgroundColor: config.bgColor, color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {subTopics.sort((a, b) => b.score - a.score).map((t) => (
                        <SkillCard key={t.topic} {...t} />
                      ))}
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
