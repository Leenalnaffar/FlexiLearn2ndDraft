import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFlexiLearnStore } from "@/store";
import { AgentOrchestrationProvider } from "@/context/agent-orchestration";
import NotFound from "@/pages/not-found";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import LearningPathPage from "@/pages/learning-path";
import SkillsPage from "@/pages/skills";
import AccessibilityPage from "@/pages/accessibility";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/learning-path" component={LearningPathPage} />
      <Route path="/skills" component={SkillsPage} />
      <Route path="/workspace" component={WorkspacePage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/accessibility" component={AccessibilityPage} />
      <Route component={NotFound} />
    </Switch>
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
