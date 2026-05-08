import { Link, useLocation } from "wouter";
import { BarChart2, GraduationCap, ChevronRight, Brain, TrendingUp, UserPlus, Home } from "lucide-react";
import { useState } from "react";
import AgentCommandCenter from "@/components/agent-command-center";
import { useFlexiLearnStore } from "@/store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/workspace", label: "Start Learning", icon: Brain },
  { href: "/skills", label: "Skills Mastery", icon: BarChart2 },
  { href: "/analytics", label: "Progress Analytics", icon: TrendingUp },
];

const STYLE_OPTIONS = [
  { key: "visual", label: "👁 Visual" },
  { key: "auditory", label: "👂 Audio" },
  { key: "kinesthetic", label: "🤲 Kines." },
  { key: "reading_writing", label: "📖 R/W" },
] as const;

const NEURO_OPTIONS = [
  { key: "none", label: "⚖ Standard" },
  { key: "adhd", label: "⚡ ADHD" },
  { key: "autism", label: "🔍 Autism" },
  { key: "dyslexia", label: "📝 Dyslexia" },
] as const;

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
  const [location, navigate] = useLocation();
  const store = useFlexiLearnStore();
  const { setProfileOverride, profileOverride, getActiveStyle, getActiveNeuro, resetForNewUser } = store;
  const currentProfile = store.profile;
  const [confirmSwitch, setConfirmSwitch] = useState(false);

  const activeStyle = getActiveStyle();
  const activeNeuro = getActiveNeuro();

  function handleStyleSwitch(style: string) {
    setProfileOverride({ learningStyle: style, neuroProfile: activeNeuro });
  }

  function handleNeuroSwitch(neuro: string) {
    setProfileOverride({ learningStyle: activeStyle, neuroProfile: neuro });
  }

  function handleSwitchUser() {
    resetForNewUser();
    navigate("/welcome");
  }

  function handleGoHome() {
    navigate("/welcome");
  }

  const isOverriding = profileOverride !== null;

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-testid="dashboard-layout">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ backgroundColor: "#1A202C" }} data-testid="sidebar">
        {/* Logo */}
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

        {/* Nav */}
        <nav className="px-3 py-4 space-y-0.5 border-b border-white/10" data-testid="sidebar-nav">
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

        {/* Quick Switch */}
        <div className="px-3 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Quick Switch</p>
            {isOverriding && (
              <button
                onClick={() => setProfileOverride(null)}
                className="text-[9px] text-white/30 hover:text-white/60 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Learning Style */}
          <div className="mb-2.5">
            <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1.5 px-1">Learning Style</p>
            <div className="grid grid-cols-2 gap-1">
              {STYLE_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleStyleSwitch(key)}
                  className={cn(
                    "text-[10px] px-2 py-1.5 rounded-md font-semibold transition-all text-left leading-none",
                    activeStyle === key
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Neuroprofile */}
          <div>
            <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1.5 px-1">Neuroprofile</p>
            <div className="grid grid-cols-2 gap-1">
              {NEURO_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleNeuroSwitch(key)}
                  className={cn(
                    "text-[10px] px-2 py-1.5 rounded-md font-semibold transition-all text-left leading-none",
                    activeNeuro === key
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isOverriding && (
            <p className="text-[9px] text-yellow-400/70 mt-2 px-1">
              ⚡ Session override active
            </p>
          )}
        </div>

        {/* Profile footer */}
        <div className="px-3 py-4 mt-auto space-y-2">
          <div className="px-3 py-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} data-testid="sidebar-profile">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Active Profile</span>
            </div>
            {currentProfile ? (
              <div className="space-y-1">
                <p className="text-white/90 text-sm font-medium">{currentProfile.displayName}</p>
                <p className="text-blue-300 text-xs">{formatLearningStyle(activeStyle)}</p>
                <p className="text-green-300/80 text-xs">{formatProfile(activeNeuro)}</p>
              </div>
            ) : (
              <p className="text-white/40 text-xs">No profile set</p>
            )}
          </div>

          {/* Switch User button */}
          {!confirmSwitch ? (
            <button
              onClick={() => setConfirmSwitch(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all group text-left"
            >
              <UserPlus className="w-4 h-4 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
              <span className="text-xs font-medium">New User / Switch Profile</span>
            </button>
          ) : (
            <div className="px-3 py-3 rounded-lg border border-red-500/30 bg-red-500/10 space-y-2">
              <p className="text-white/80 text-xs font-semibold">Start fresh for a new user?</p>
              <p className="text-white/40 text-[10px]">All current progress, topics, and XP will be cleared. You'll be taken to setup.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmSwitch(false)}
                  className="flex-1 py-1.5 rounded-md text-[11px] font-semibold text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSwitchUser}
                  className="flex-1 py-1.5 rounded-md text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all"
                >
                  Yes, switch
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-white/60 backdrop-blur-sm flex-shrink-0" data-testid="dashboard-header">
          <div className="flex items-center gap-3">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
          </div>
          <div className="flex items-center gap-3">
            {/* Home button */}
            <button
              onClick={handleGoHome}
              title="Go to home screen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/60 transition-all group"
            >
              <Home className="w-3.5 h-3.5 transition-colors group-hover:text-blue-600" style={{ color: "#3B5BDB" }} />
              <span className="text-xs font-medium" style={{ color: "#3B5BDB" }}>Home</span>
            </button>

            {/* Profile badge */}
            {currentProfile ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background" data-testid="header-profile-badge">
                <div className={cn("w-1.5 h-1.5 rounded-full", isOverriding ? "bg-yellow-400 animate-pulse" : "bg-green-400 animate-pulse")} />
                <span className="text-xs font-medium text-foreground">{formatLearningStyle(activeStyle)}</span>
                <span className="text-border">|</span>
                <span className="text-xs text-muted-foreground">{formatProfile(activeNeuro)}</span>
                {isOverriding && <span className="text-[10px] text-yellow-600 font-bold">OVERRIDE</span>}
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
