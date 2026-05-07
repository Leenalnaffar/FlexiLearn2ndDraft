import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Target, Brain, Clock, Zap, Award, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useFlexiLearnStore } from "@/store";
import { cn } from "@/lib/utils";

function getMasteryLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Expert", color: "#22c55e" };
  if (score >= 65) return { label: "Advanced", color: "#3B5BDB" };
  if (score >= 45) return { label: "Intermediate", color: "#8b5cf6" };
  if (score >= 25) return { label: "Beginner", color: "#f59e0b" };
  return { label: "Novice", color: "#ef4444" };
}

function CircularProgress({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#3B5BDB" : "#f59e0b";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const store = useFlexiLearnStore();
  const topics = Object.values(store.topicMastery);
  const sorted = [...topics].sort((a, b) => b.score - a.score);

  const masteredCount = topics.filter((t) => t.score >= 75).length;
  const weakCount = topics.filter((t) => t.score < 40).length;
  const avgScore = topics.length > 0 ? Math.round(topics.reduce((s, t) => s + t.score, 0) / topics.length) : 0;

  const subjectGroups: Record<string, typeof topics> = {};
  topics.forEach((t) => {
    if (!subjectGroups[t.subject]) subjectGroups[t.subject] = [];
    subjectGroups[t.subject].push(t);
  });

  const recentInteractions = [...store.interactionHistory].reverse().slice(0, 8);

  return (
    <DashboardLayout title="Progress Analytics">
      <div className="space-y-6" data-testid="analytics-page">
        <div>
          <h2 className="text-xl font-bold text-foreground">Progress Analytics</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your learning journey tracked in real time — driven by your interactions.
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#3B5BDB15" }}>
              <BarChart2 className="w-7 h-7" style={{ color: "#3B5BDB" }} />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No data yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Start asking questions in the Agent Workspace to build your analytics profile.
            </p>
            <button
              onClick={() => setLocation("/workspace")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
              style={{ backgroundColor: "#3B5BDB" }}
            >
              Go to Agent Workspace <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Engagement Score", value: `${store.engagementScore}%`, icon: Zap, color: "#3B5BDB", sub: "Session activity" },
                { label: "Topics Studied", value: topics.length, icon: Brain, color: "#8b5cf6", sub: "Unique topics" },
                { label: "Topics Mastered", value: masteredCount, icon: Award, color: "#22c55e", sub: "Score ≥ 75%" },
                { label: "Questions Asked", value: store.sessionInteractions, icon: Clock, color: "#f59e0b", sub: "This session" },
              ].map(({ label, value, icon: Icon, color, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall progress + Subject breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Overall mastery circle */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Overall Mastery</p>
                <div className="relative">
                  <CircularProgress value={avgScore} size={110} stroke={8} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{avgScore}%</span>
                    <span className="text-[10px] text-muted-foreground">{getMasteryLevel(avgScore).label}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 w-full">
                  {[
                    { label: "Weak", count: weakCount, color: "#ef4444" },
                    { label: "Learning", count: topics.length - masteredCount - weakCount, color: "#f59e0b" },
                    { label: "Mastered", count: masteredCount, color: "#22c55e" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-bold" style={{ color }}>{count}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject groups */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">By Subject</h3>
                {Object.keys(subjectGroups).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subjects yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(subjectGroups).map(([subject, subTopics]) => {
                      const avg = Math.round(subTopics.reduce((s, t) => s + t.score, 0) / subTopics.length);
                      const { color } = getMasteryLevel(avg);
                      return (
                        <div key={subject}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{subject}</span>
                            <span className="text-xs text-muted-foreground">{avg}% · {subTopics.length} topic{subTopics.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${avg}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {subTopics.slice(0, 4).map((t) => (
                              <span key={t.topic} className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                                {t.topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* All topics mastery table */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> All Topics
                </h3>
                <span className="text-xs text-muted-foreground">{topics.length} tracked</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sorted.map((t) => {
                  const { label, color } = getMasteryLevel(t.score);
                  return (
                    <div key={t.topic} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                        <Target className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className="text-xs font-semibold text-foreground truncate">{t.topic}</span>
                          <span className="text-xs font-bold" style={{ color }}>{t.score}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.score}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground capitalize">{label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{t.subject} · {t.interactions}x</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent interactions */}
            {recentInteractions.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Questions</h3>
                <div className="space-y-2">
                  {recentInteractions.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 border border-border">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-blue-600">{recentInteractions.length - i}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{item.question}</p>
                        {item.topics.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {item.topics.map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#3B5BDB15", color: "#3B5BDB" }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
