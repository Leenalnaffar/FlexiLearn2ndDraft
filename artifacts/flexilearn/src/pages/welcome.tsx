import { useState } from "react";
import { useLocation } from "wouter";
import { useFlexiLearnStore } from "@/store";
import { Input } from "@/components/ui/input";
import { GraduationCap, ArrowRight, Sparkles, Loader2 } from "lucide-react";

export default function WelcomePage() {
  const [, navigate] = useLocation();
  const { profile, setProfile } = useFlexiLearnStore();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/learner-profiles/lookup?name=${encodeURIComponent(trimmed)}`
      );

      if (res.ok) {
        const data = await res.json();
        setProfile({
          displayName: data.displayName,
          learningStyle: data.learningStyle,
          neuroProfile: data.neurodivergentProfile,
        });
        navigate("/workspace");
      } else if (res.status === 404) {
        navigate(`/onboarding?name=${encodeURIComponent(trimmed)}`);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#F7FAFC" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #3B5BDB 0%, #1A202C 100%)" }}
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#1A202C" }}
            >
              FlexiLearn
            </h1>
            <p className="text-sm" style={{ color: "#718096" }}>
              Adaptive Educational Platform
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Card header */}
          <div
            className="px-8 py-6"
            style={{
              background: "linear-gradient(135deg, #1A202C 0%, #2D3748 100%)",
            }}
          >
            <h2 className="text-xl font-bold text-white">Welcome</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              Enter your name to load your profile or create a new account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="welcome-name"
                className="text-sm font-semibold"
                style={{ color: "#2D3748" }}
              >
                Your Name
              </label>
              <Input
                id="welcome-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Alex, Jordan, Sam…"
                autoFocus
                autoComplete="off"
                className="h-11 border-slate-200 focus-visible:ring-blue-500"
              />
              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #3B5BDB 0%, #1A202C 100%)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Looking up…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Continue as current user */}
          {profile && (
            <>
              <div className="px-8 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-medium text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="px-8 pb-6 pt-3">
                <button
                  onClick={() => navigate("/workspace")}
                  className="w-full h-10 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/60 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ color: "#3B5BDB" }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Continue as {profile.displayName}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#A0AEC0" }}>
          New name → creates a new account &nbsp;·&nbsp; Existing name → loads your saved progress
        </p>
      </div>
    </div>
  );
}
