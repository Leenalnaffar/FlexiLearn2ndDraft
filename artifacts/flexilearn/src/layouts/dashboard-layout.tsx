import { Link, useLocation } from "wouter";
import { BookOpen, BarChart2, Settings, GraduationCap, ChevronRight, Brain, TrendingUp } from "lucide-react";
import { useGetCurrentLearnerProfile } from "@workspace/api-client-react";
import { useEffect } from "react";
import AgentCommandCenter from "@/components/agent-command-center";
import { useFlexiLearnStore } from "@/store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/workspace", label: "Start Learning", icon: Brain },
  { href: "/skills", label: "Skills Mastery", icon: BarChart2 },
  { href: "/analytics", label: "Progress Analytics", icon: TrendingUp },
  { href: "/accessibility", label: "Accessibility Settings", icon: Settings },
];

function formatLearningStyle(style: string): string {
  const map: Record<string, string> = {
    visual: "Visual Learner",
    auditory: "Auditory Learner",
    kinesthetic: "Kinesthetic Learner",
    reading_writing: "Reading/Writing",
  };
  return map[style] ?? style;
}

function formatProfile(profile: string): string {
  const map: Record<string, string> = {
    none: "Standard Mode",
    adhd: "ADHD Mode",
    dyslexia: "Dyslexia Mode",
    autism: "Autism Mode",
  };
  return map[profile] ?? profile;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  noPadding?: boolean;
}

export default function DashboardLayout({ children, title, noPadding }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { data: profile } = useGetCurrentLearnerProfile();
  const setProfile = useFlexiLearnStore((s) => s.setProfile);

  useEffect(() => {
    if (profile) {
      setProfile({
        displayName: profile.displayName,
        learningStyle: profile.learningStyle,
        neuroProfile: profile.neurodivergentProfile,
      });
    }
  }, [profile, setProfile]);

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-testid="dashboard-layout">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ backgroundColor: "#1A202C" }} data-testid="sidebar">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(228 66% 54%)" }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm tracking-tight">FlexiLearn</h1>
              <p className="text-white/40 text-xs">Adaptive AI Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" data-testid="sidebar-nav">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href === "/workspace" && location === "/");
            return (
              <Link key={href} href={href}>
                <div
                  data-testid={`nav-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/6 hover:text-white/90"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? "text-blue-400" : "text-white/40 group-hover:text-white/70")} />
                  <span className="text-sm font-medium flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-blue-400/70" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} data-testid="sidebar-profile">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Active Profile</span>
            </div>
            {profile ? (
              <div className="space-y-1">
                <p className="text-white/90 text-sm font-medium">{profile.displayName}</p>
                <p className="text-blue-300 text-xs">{formatLearningStyle(profile.learningStyle)}</p>
                <p className="text-green-300/80 text-xs">{formatProfile(profile.neurodivergentProfile)}</p>
              </div>
            ) : (
              <p className="text-white/40 text-xs">No profile set</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-white/60 backdrop-blur-sm flex-shrink-0" data-testid="dashboard-header">
          <div className="flex items-center gap-3">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
          </div>
          <div className="flex items-center gap-2">
            {profile ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background" data-testid="header-profile-badge">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-foreground">{formatLearningStyle(profile.learningStyle)}</span>
                <span className="text-border">|</span>
                <span className="text-xs text-muted-foreground">{formatProfile(profile.neurodivergentProfile)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                <span className="text-xs text-muted-foreground">No active profile</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <main
            className={cn("flex-1 overflow-y-auto", noPadding ? "p-0" : "p-6")}
            style={{ backgroundColor: "#F7FAFC" }}
            data-testid="main-workspace"
          >
            {children}
          </main>

          <aside className="w-72 flex-shrink-0 border-l border-border bg-white overflow-y-auto" data-testid="agent-command-center">
            <AgentCommandCenter />
          </aside>
        </div>
      </div>
    </div>
  );
}
