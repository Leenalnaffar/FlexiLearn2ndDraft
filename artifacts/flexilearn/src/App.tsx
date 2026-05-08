import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFlexiLearnStore } from "@/store";
import { AgentOrchestrationProvider } from "@/context/agent-orchestration";
import WelcomePage from "@/pages/welcome";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import LearningPathPage from "@/pages/learning-path";
import SkillsPage from "@/pages/skills";
import WorkspacePage from "@/pages/workspace";
import AnalyticsPage from "@/pages/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function GlobalAccessibilityApplicator() {
  const accessibility = useFlexiLearnStore((s) => s.accessibility);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--flexi-font-size", `${accessibility.fontSize}px`);
    root.style.setProperty("--flexi-line-spacing", String(accessibility.lineSpacing));

    const body = document.body;

    if (accessibility.dyslexicFont) {
      body.style.fontFamily = '"OpenDyslexic", "Comic Sans MS", "Arial", sans-serif';
    } else {
      body.style.fontFamily = "";
    }

    if (accessibility.focusMode) {
      body.classList.add("focus-mode");
    } else {
      body.classList.remove("focus-mode");
    }

    if (accessibility.highContrast) {
      body.classList.add("high-contrast");
    } else {
      body.classList.remove("high-contrast");
    }

    if (accessibility.reduceMotion) {
      body.classList.add("reduce-motion");
    } else {
      body.classList.remove("reduce-motion");
    }

    const themeMap: Record<string, string> = {
      default: "",
      sepia: "sepia",
      "high-contrast": "high-contrast",
    };
    body.setAttribute("data-theme", themeMap[accessibility.theme] ?? "");
  }, [accessibility]);

  return null;
}

const UNAUTHENTICATED_PATHS = ["/welcome", "/onboarding"];

function ProfileGuard({ children }: { children: React.ReactNode }) {
  const profile = useFlexiLearnStore((s) => s.profile);
  const [location, navigate] = useLocation();

  useEffect(() => {
    const isPublic = UNAUTHENTICATED_PATHS.some((p) => location.startsWith(p));
    if (!profile && !isPublic) {
      navigate("/welcome");
    }
  }, [profile, location, navigate]);

  return <>{children}</>;
}

function Router() {
  return (
    <ProfileGuard>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/welcome" component={WelcomePage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/learning-path" component={LearningPathPage} />
        <Route path="/skills" component={SkillsPage} />
        <Route path="/workspace" component={WorkspacePage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="*"><Redirect to="/" /></Route>
      </Switch>
    </ProfileGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AgentOrchestrationProvider>
          <GlobalAccessibilityApplicator />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AgentOrchestrationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
