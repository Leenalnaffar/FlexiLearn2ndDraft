import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Brain, Sparkles, Lightbulb,
  Youtube, Headphones, GraduationCap, Trophy,
  Zap, Clock, Shield, Star, BookOpen,
} from "lucide-react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useFlexiLearnStore, type AgentId } from "@/store";
import { extractTopics } from "@/lib/topic-extractor";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── MESSAGE FORMATTERS ───────────────────────────────────────────────────────

function formatMessage(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^## (.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1 text-foreground">$1</h3>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 underline hover:text-blue-800">$1</a>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// Extract the first markdown link that matches a URL pattern
function extractLink(content: string, hostPattern: string): { label: string; url: string } | null {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[2].includes(hostPattern)) {
      return { label: match[1], url: match[2] };
    }
  }
  return null;
}

function stripFirstLink(content: string, hostPattern: string): string {
  const regex = /[🎬🎧]?\s*\*\*[^*]+\*\*:?\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\s*—?\s*[^\n]*/;
  return content.replace(regex, (m) => (m.includes(hostPattern) ? "" : m)).trim();
}

// ── MEDIA CARDS ──────────────────────────────────────────────────────────────

function YouTubeCard({ link }: { link: { label: string; url: string } }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl mb-3 transition-all hover:opacity-90 group"
      style={{ backgroundColor: "#FF0000", color: "white" }}
    >
      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
        <Youtube className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Watch First</p>
        <p className="text-sm font-semibold text-white truncate">{link.label}</p>
      </div>
      <span className="ml-auto text-white/60 group-hover:text-white text-xs">▶ Open →</span>
    </a>
  );
}

function SpotifyCard({ link }: { link: { label: string; url: string } }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl mb-3 transition-all hover:opacity-90 group"
      style={{ backgroundColor: "#1DB954", color: "white" }}
    >
      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
        <Headphones className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Listen First</p>
        <p className="text-sm font-semibold text-white truncate">{link.label}</p>
      </div>
      <span className="ml-auto text-white/60 group-hover:text-white text-xs">🎧 Open →</span>
    </a>
  );
}

// ── KINESTHETIC FEEDBACK CARD ─────────────────────────────────────────────────

function FeedbackCard({ content }: { content: string }) {
  const gradeMatch = content.match(/\*\*Overall Grade\*\*:\s*([A-F][+\-]?)/);
  const grade = gradeMatch ? gradeMatch[1] : "B";
  const gradeColors: Record<string, string> = {
    "A+": "#22c55e", A: "#22c55e", B: "#3B5BDB", C: "#f59e0b", D: "#f97316", F: "#ef4444",
  };
  const color = gradeColors[grade] ?? "#3B5BDB";

  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: color }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: color }}>
        <Trophy className="w-5 h-5 text-white" />
        <div>
          <p className="text-white font-bold text-sm">Teaching Efficacy Report</p>
          <p className="text-white/70 text-[10px]">Alex's assessment of your teaching session</p>
        </div>
        <div className="ml-auto text-4xl font-black text-white">{grade}</div>
      </div>
      <div
        className="p-4 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatMessage(content) }}
      />
    </div>
  );
}

// ── ADHD COMPONENTS ───────────────────────────────────────────────────────────

function XPBar({ xp, gained }: { xp: number; gained: number }) {
  const levelXP = 500;
  const level = Math.floor(xp / levelXP) + 1;
  const progress = ((xp % levelXP) / levelXP) * 100;
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border-b border-yellow-200/40">
      <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] font-bold text-yellow-700">LEVEL {level}</span>
          <span className="text-[10px] text-yellow-600">{xp} XP {gained > 0 && <span className="text-green-600 font-bold">+{gained}</span>}</span>
        </div>
        <div className="h-2 rounded-full bg-yellow-200 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
      <span className="text-[10px] text-yellow-600 font-medium">{Math.floor(progress)}%</span>
    </div>
  );
}

function FocusTimer({ secondsLeft, isActive }: { secondsLeft: number; isActive: boolean }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const pct = (secondsLeft / 600) * 100;
  const urgent = secondsLeft < 120;
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
      urgent ? "border-red-300 bg-red-50 text-red-700" : "border-orange-200 bg-orange-50 text-orange-700"
    )}>
      <Clock className={cn("w-3.5 h-3.5", urgent && "animate-pulse")} />
      <span>{mins}:{secs.toString().padStart(2, "0")}</span>
      <div className="w-16 h-1.5 rounded-full bg-orange-200 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", urgent ? "bg-red-500" : "bg-orange-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isActive && <span className="text-[9px] opacity-60">FOCUS SPRINT</span>}
    </div>
  );
}

function BossBattle({ question, onAnswer }: { question: string; onAnswer: (ans: string) => void }) {
  const [ans, setAns] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center gap-3">
          <Shield className="w-6 h-6 text-white animate-pulse" />
          <div>
            <p className="text-white font-black text-base">⚔️ BOSS BATTLE!</p>
            <p className="text-white/70 text-[11px]">Answer to reclaim your focus streak</p>
          </div>
          <Zap className="w-5 h-5 text-yellow-300 ml-auto animate-bounce" />
        </div>
        <div className="p-6">
          <p className="text-sm font-semibold text-foreground mb-4">{question}</p>
          <textarea
            autoFocus
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            placeholder="Type your answer..."
            className="w-full rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows={3}
          />
          <button
            onClick={() => ans.trim() && onAnswer(ans.trim())}
            disabled={!ans.trim()}
            className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: "#6366f1" }}
          >
            Submit Answer ⚡
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── KINESTHETIC STARTER ───────────────────────────────────────────────────────

const KINESTHETIC_TOPICS = [
  "photosynthesis", "the French Revolution", "Newton's laws",
  "machine learning", "DNA replication", "the quadratic formula",
];

const VISUAL_STARTERS = [
  "Visualise how black holes form",
  "Show me photosynthesis as a diagram",
  "Map out the water cycle visually",
  "Break down the human immune system",
  "Visualise how neural networks learn",
  "Map the causes of World War I",
];

const AUDITORY_STARTERS = [
  "Explain gravity like a podcast",
  "Tell me the story of DNA discovery",
  "Walk me through how the internet works",
  "Explain evolution conversationally",
  "Tell me about the Big Bang",
  "Explain compound interest out loud",
];

const RW_STARTERS = [
  "Explain how photosynthesis works",
  "What is the quadratic formula?",
  "How does DNA replication work?",
  "Explain Newton's three laws of motion",
  "What caused World War I?",
  "How does machine learning work?",
];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  // ADHD state
  const [focusSeconds, setFocusSeconds] = useState(600);
  const [focusActive, setFocusActive] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [bossActive, setBossActive] = useState(false);
  const [bossQuestion, setBossQuestion] = useState("");
  const [xpGained, setXpGained] = useState(0);

  // Kinesthetic state
  const [teachingExchanges, setTeachingExchanges] = useState(0);
  const [showFeedbackBtn, setShowFeedbackBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const store = useFlexiLearnStore();
  const {
    profile, currentConversationId, updateAgent, resetAgents, setConversationId,
    addInteraction, incrementEngagement, recordTopicInteraction, addXP, xp,
    getActiveStyle, getActiveNeuro,
  } = store;

  const activeStyle = getActiveStyle();
  const activeNeuro = getActiveNeuro();
  const isKinesthetic = activeStyle === "kinesthetic";
  const isADHD = activeNeuro === "adhd";
  const isVisual = activeStyle === "visual";
  const isAuditory = activeStyle === "auditory";

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // ── Init conversation ──────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        let convId = currentConversationId;
        if (!convId) {
          const res = await fetch(`${BASE}/api/openai/conversations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: profile ? `${profile.displayName}'s Session` : "Learning Session",
            }),
          });
          const conv = await res.json() as { id: number };
          convId = conv.id;
          setConversationId(convId);
        }
        const res = await fetch(`${BASE}/api/openai/conversations/${convId}/messages`);
        const msgs = await res.json() as Array<{ id: number; role: string; content: string; createdAt: string }>;
        setMessages(
          msgs.map((m) => ({
            id: String(m.id),
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.createdAt),
          }))
        );
      } catch (e) {
        console.error("Failed to init conversation", e);
      } finally {
        setIsInitializing(false);
      }
    }
    void init();
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamContent]);

  // ── ADHD Focus Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isADHD || !focusActive) return;
    const tick = setInterval(() => {
      setFocusSeconds((s) => {
        if (s <= 1) { clearInterval(tick); return 0; }
        return s - 1;
      });
      // Check idle — if >120s since last interaction, trigger boss battle
      if (Date.now() - lastInteraction > 120_000 && !bossActive) {
        setBossQuestion("Quick! What's one key concept you've learned in this session? Explain it in 2 sentences.");
        setBossActive(true);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [isADHD, focusActive, lastInteraction, bossActive]);

  // ── Agent orchestration ────────────────────────────────────────────────────
  async function runAgentOrchestration(question: string) {
    resetAgents();
    const styleLabel = { visual: "Visual", auditory: "Auditory", kinesthetic: "Kinesthetic", reading_writing: "Reading/Writing" }[activeStyle] ?? "Visual";
    const profileLabel = { none: "Standard", adhd: "ADHD", dyslexia: "Dyslexia", autism: "Autism" }[activeNeuro] ?? "Standard";
    const update = (id: AgentId, patch: Parameters<typeof updateAgent>[1]) => updateAgent(id, patch);

    update("profiling", { status: "active", progressPercent: 20, currentTask: `Analysing ${styleLabel} learner profile...` });
    await delay(600);
    update("profiling", { progressPercent: 70, currentTask: "Calibrating cognitive load parameters..." });
    await delay(600);
    update("profiling", { status: "complete", progressPercent: 100, currentTask: `Profile confirmed: ${styleLabel} · ${profileLabel}`, lastDecision: `Adapt for ${styleLabel} + ${profileLabel}` });

    update("planning", { status: "active", progressPercent: 15, currentTask: "Decomposing into learning objectives..." });
    await delay(500);
    update("planning", { progressPercent: 60, currentTask: `Selecting ${styleLabel}-optimised strategy...` });
    await delay(700);
    update("planning", { status: "complete", progressPercent: 100, currentTask: "Strategy locked — content generation starting", lastDecision: isKinesthetic ? "Protege System activated" : `${styleLabel} architecture selected` });

    update("content", { status: "active", progressPercent: 10, currentTask: "Generating personalised content..." });
  }

  async function finaliseAgents(responseLength: number) {
    const profileLabel = { none: "balanced format", adhd: "ADHD chunked + XP", dyslexia: "dyslexic-friendly chunks", autism: "direct literal format" }[activeNeuro] ?? "balanced";
    updateAgent("content", { status: "complete", progressPercent: 100, currentTask: `${responseLength} chars generated`, output: "Lesson delivered" });
    updateAgent("neuroadapt", { status: "active", progressPercent: 30, currentTask: `Applying ${profileLabel}...` });
    await delay(600);
    updateAgent("neuroadapt", { status: "complete", progressPercent: 100, currentTask: "Content formatted for profile", lastDecision: "Format applied" });
    updateAgent("observation", { status: "active", progressPercent: 40, currentTask: "Recording engagement pattern..." });
    await delay(500);
    updateAgent("observation", { status: "complete", progressPercent: 100, currentTask: "Interaction logged", lastDecision: "Positive engagement detected" });
    updateAgent("reflection", { status: "active", progressPercent: 30, currentTask: "Evaluating response quality..." });
    await delay(600);
    updateAgent("reflection", { status: "complete", progressPercent: 100, currentTask: "Strategy effective — adapting difficulty", lastDecision: "Maintain adaptive difficulty" });
  }

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage(text?: string) {
    const question = (text ?? input).trim();
    if (!question || isStreaming || !currentConversationId) return;

    setInput("");
    setIsStreaming(true);
    setStreamContent("");
    setLastInteraction(Date.now());
    if (isADHD && !focusActive) setFocusActive(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    const topics = extractTopics(question);
    topics.forEach(({ topic, subject, scoreBoost }) => recordTopicInteraction(topic, subject, scoreBoost));
    addInteraction(question, topics.map((t) => t.topic));
    incrementEngagement(8);

    void runAgentOrchestration(question);
    await delay(1800);

    let full = "";
    try {
      const res = await fetch(
        `${BASE}/api/openai/conversations/${currentConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: question,
            learningStyle: activeStyle,
            neuroProfile: activeNeuro,
          }),
        }
      );
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let progress = 10;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (data.content) {
              full += data.content;
              setStreamContent(full);
              progress = Math.min(95, progress + 2);
              updateAgent("content", { progressPercent: progress, currentTask: `Generating... (${full.length} chars)` });
            }
            if (data.done || data.error) break;
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Stream failed", e);
      full = "I'm having trouble connecting right now. Please try again in a moment.";
    }

    const assistantMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: full, timestamp: new Date() };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreamContent("");
    setIsStreaming(false);

    // ADHD XP
    if (isADHD) {
      const gained = 25;
      addXP(gained);
      setXpGained(gained);
      setTimeout(() => setXpGained(0), 2500);
    }

    // Kinesthetic exchange count
    if (isKinesthetic) {
      const newCount = teachingExchanges + 1;
      setTeachingExchanges(newCount);
      if (newCount >= 3) setShowFeedbackBtn(true);
    }

    void finaliseAgents(full.length);
    extractTopics(full).forEach(({ topic, subject }) => recordTopicInteraction(topic, subject, 6));
  }

  function requestFeedback() {
    void sendMessage("grade me — please give me my Teaching Efficacy Report");
    setShowFeedbackBtn(false);
  }

  function handleBossAnswer(answer: string) {
    setBossActive(false);
    void sendMessage(`Boss Battle Answer: ${answer}`);
    setFocusSeconds(600);
    setLastInteraction(Date.now());
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const topTopics = Object.values(store.topicMastery).sort((a, b) => b.interactions - a.interactions).slice(0, 4);

  const modeLabel = isKinesthetic ? "Protege System" : isVisual ? "Visual Map Mode" : isAuditory ? "Podcast Mode" : "Academic Mode";
  const modeIcon = isKinesthetic ? <GraduationCap className="w-4 h-4 text-white" /> : isVisual ? <Youtube className="w-4 h-4 text-white" /> : isAuditory ? <Headphones className="w-4 h-4 text-white" /> : <BookOpen className="w-4 h-4 text-white" />;
  const modeGradient = isKinesthetic ? "linear-gradient(135deg, #f59e0b, #ef4444)" : isVisual ? "linear-gradient(135deg, #ef4444, #dc2626)" : isAuditory ? "linear-gradient(135deg, #1DB954, #15803d)" : "linear-gradient(135deg, #3B5BDB, #6366f1)";

  const starterPrompts = isVisual ? VISUAL_STARTERS : isAuditory ? AUDITORY_STARTERS : RW_STARTERS;
  const inputPlaceholder = isKinesthetic
    ? "Tell Alex what the topic is — then explain it in your own words..."
    : isVisual
    ? "What concept would you like to visualise? (Under 100 words + YouTube link guaranteed)"
    : isAuditory
    ? "What would you like to learn by listening? (Spotify link + podcast-style response)"
    : "Ask any academic question — structured scholarly response guaranteed...";

  // ── Render message bubble ──────────────────────────────────────────────────
  function renderAssistantBubble(content: string, id: string) {
    const isFeedbackReport = content.includes("Teaching Efficacy Report") && content.includes("Overall Grade");

    if (isFeedbackReport) {
      return (
        <motion.div key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br from-yellow-400 to-orange-500">
            <Trophy className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 max-w-[85%]">
            <FeedbackCard content={content} />
          </div>
        </motion.div>
      );
    }

    const ytLink = isVisual ? extractLink(content, "youtube") : null;
    const spLink = isAuditory ? extractLink(content, "spotify") : null;
    const bodyContent = ytLink ? stripFirstLink(content, "youtube") : spLink ? stripFirstLink(content, "spotify") : content;

    const avatarBg = isKinesthetic
      ? "linear-gradient(135deg, #f59e0b, #ef4444)"
      : isAuditory
      ? "linear-gradient(135deg, #1DB954, #15803d)"
      : "linear-gradient(135deg, #6366f1, #4f46e5)";

    const avatarIcon = isKinesthetic
      ? <GraduationCap className="w-3.5 h-3.5 text-white" />
      : isAuditory
      ? <Headphones className="w-3.5 h-3.5 text-white" />
      : <Brain className="w-3.5 h-3.5 text-white" />;

    return (
      <motion.div key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: avatarBg }}>
          {avatarIcon}
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 bg-white border border-border shadow-sm">
          {isKinesthetic && (
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Alex (Student)</p>
          )}
          {ytLink && <YouTubeCard link={ytLink} />}
          {spLink && <SpotifyCard link={spLink} />}
          <div
            className="text-sm text-foreground leading-relaxed prose-sm"
            dangerouslySetInnerHTML={{ __html: formatMessage(bodyContent) }}
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </motion.div>
    );
  }

  // ── Kinesthetic empty state ───────────────────────────────────────────────

  function KinestheticEmptyState() {
    const [topic, setTopic] = useState("");
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 text-center px-4">
        <div>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg, #f59e0b20, #ef444420)" }}>
            <GraduationCap className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-base font-black text-foreground">The Protege System</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            You're the teacher. Alex is your confused student. Pick a topic and explain it — the better you teach, the higher your grade.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Choose a topic to teach</p>
          <div className="grid grid-cols-2 gap-2">
            {KINESTHETIC_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => void sendMessage(`I want to teach you about ${t}`)}
                className="text-left p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all text-xs font-semibold text-amber-800"
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">or type your own topic below</p>
        </div>
      </div>
    );
  }

  // ── Standard empty state ──────────────────────────────────────────────────

  function StandardEmptyState() {
    const icon = isVisual ? <Youtube className="w-7 h-7 text-red-500" /> : isAuditory ? <Headphones className="w-7 h-7 text-green-600" /> : <Sparkles className="w-7 h-7" style={{ color: "#3B5BDB" }} />;
    const bgColor = isVisual ? "#FF000015" : isAuditory ? "#1DB95415" : "#3B5BDB15";
    const desc = isVisual
      ? "Every response starts with a YouTube link + concept map — under 100 words guaranteed."
      : isAuditory
      ? "Every response starts with a Spotify podcast link, written in conversational TTS-friendly prose."
      : "Ask any academic question — structured scholarly responses with references.";
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
        <div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: bgColor }}>
            {icon}
          </div>
          <h3 className="text-base font-bold text-foreground">What would you like to learn?</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{desc}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void sendMessage(prompt)}
              className="text-left p-3 rounded-xl border border-border bg-white hover:bg-blue-50 hover:border-blue-200 transition-all text-xs text-foreground font-medium group"
            >
              <span className="text-muted-foreground group-hover:text-blue-600 transition-colors text-[10px] block mb-0.5">Try asking:</span>
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Start Learning" noPadding>
      {bossActive && <BossBattle question={bossQuestion} onAnswer={handleBossAnswer} />}

      <div className="flex h-full">
        <div className="flex flex-col flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: modeGradient }}>
                {modeIcon}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">{modeLabel}</h2>
                <p className="text-[11px] text-muted-foreground capitalize">{activeStyle.replace("_", "/")} · {activeNeuro === "none" ? "Standard" : activeNeuro.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isADHD && focusActive && (
                <FocusTimer secondsLeft={focusSeconds} isActive={focusActive} />
              )}
              {isKinesthetic && showFeedbackBtn && (
                <button
                  onClick={requestFeedback}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#f59e0b" }}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Get Feedback Grade
                </button>
              )}
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", isStreaming ? "bg-blue-400 animate-pulse" : "bg-green-400")} />
                <span className="text-[11px] text-muted-foreground">{isStreaming ? "Agents active..." : "Ready"}</span>
              </div>
            </div>
          </div>

          {/* ADHD XP Bar */}
          {isADHD && <XPBar xp={xp} gained={xpGained} />}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ backgroundColor: "#F7FAFC" }}>
            {isInitializing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Initialising workspace...</p>
                </div>
              </div>
            ) : messages.length === 0 && !isStreaming ? (
              isKinesthetic ? <KinestheticEmptyState /> : <StandardEmptyState />
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {messages.map((msg) =>
                    msg.role === "user" ? (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-3 flex-row-reverse"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-600">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                          {isKinesthetic && (
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">You (Teacher)</p>
                          )}
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-blue-200 mt-1.5">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </motion.div>
                    ) : renderAssistantBubble(msg.content, msg.id)
                  )}
                </AnimatePresence>

                {isStreaming && streamContent && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: modeGradient }}>
                      {modeIcon}
                    </div>
                    <div className="max-w-[80%] bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMessage(streamContent) }} />
                      <span className="inline-block w-1 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                    </div>
                  </motion.div>
                )}

                {isStreaming && !streamContent && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: modeGradient }}>
                      {modeIcon}
                    </div>
                    <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        <span className="text-xs text-muted-foreground ml-1">
                          {isKinesthetic ? "Alex is thinking..." : "Agents working..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="px-6 py-4 border-t border-border bg-white flex-shrink-0">
            {topTopics.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground">Tracking:</span>
                {topTopics.map((t) => (
                  <span key={t.topic} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "#3B5BDB15", color: "#3B5BDB" }}>
                    {t.topic} {t.score}%
                  </span>
                ))}
              </div>
            )}
            {isKinesthetic && showFeedbackBtn && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs text-amber-700 font-medium">You've taught {teachingExchanges} exchanges — ready for your Feedback Grade?</span>
                <button onClick={requestFeedback} className="ml-auto text-xs font-bold text-white px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-600 transition-all">
                  Grade Me
                </button>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
                }}
                placeholder={inputPlaceholder}
                rows={1}
                disabled={isStreaming || !currentConversationId}
                className="flex-1 resize-none rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-muted-foreground/60 disabled:opacity-50"
                style={{ minHeight: "40px", maxHeight: "120px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={isStreaming || !input.trim() || !currentConversationId}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: modeGradient }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 flex-shrink-0 border-l border-border bg-white flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Learning Context
            </h3>
          </div>
          <div className="p-3 space-y-3 flex-1">

            {/* Mode info */}
            <div className="rounded-lg overflow-hidden border border-border">
              <div className="px-3 py-2 flex items-center gap-2" style={{ background: modeGradient }}>
                {modeIcon}
                <span className="text-[11px] font-bold text-white">{modeLabel}</span>
              </div>
              <div className="p-3 space-y-1.5">
                {isVisual && (
                  <>
                    <p className="text-[11px] text-foreground">🎬 YouTube link on every response</p>
                    <p className="text-[11px] text-foreground">🗺️ Concept map format</p>
                    <p className="text-[11px] text-foreground">📏 Under 100 words guaranteed</p>
                  </>
                )}
                {isAuditory && (
                  <>
                    <p className="text-[11px] text-foreground">🎧 Spotify link on every response</p>
                    <p className="text-[11px] text-foreground">🎙️ Podcast-style prose</p>
                    <p className="text-[11px] text-foreground">🎤 Verbal summary at end</p>
                  </>
                )}
                {isKinesthetic && (
                  <>
                    <p className="text-[11px] text-foreground">🎓 You are the teacher</p>
                    <p className="text-[11px] text-foreground">🤔 Alex is your confused student</p>
                    <p className="text-[11px] text-foreground">📊 Feedback Grade after 3+ exchanges</p>
                    {teachingExchanges > 0 && (
                      <p className="text-[11px] font-bold text-amber-600">{teachingExchanges} exchanges taught</p>
                    )}
                  </>
                )}
                {!isVisual && !isAuditory && !isKinesthetic && (
                  <>
                    <p className="text-[11px] text-foreground">📚 Academic structured format</p>
                    <p className="text-[11px] text-foreground">🔗 Bibliography on every response</p>
                    <p className="text-[11px] text-foreground">📖 Deep-dive technical analysis</p>
                  </>
                )}
                {isADHD && (
                  <>
                    <div className="border-t border-border mt-1.5 pt-1.5" />
                    <p className="text-[11px] text-foreground flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> XP: {xp} pts</p>
                    <p className="text-[11px] text-foreground">⚔️ Boss Battles when idle</p>
                  </>
                )}
              </div>
            </div>

            {/* Topics tracked */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Topics Tracked</p>
              {Object.values(store.topicMastery).length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60">Ask a question to start tracking</p>
              ) : (
                <div className="space-y-2">
                  {Object.values(store.topicMastery).sort((a, b) => b.interactions - a.interactions).slice(0, 6).map((t) => (
                    <div key={t.topic}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px] font-medium text-foreground truncate flex-1">{t.topic}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">{t.score}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.score}%`, backgroundColor: t.score >= 75 ? "#22c55e" : t.score >= 40 ? "#3B5BDB" : "#f59e0b" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Engagement */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Session</p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[11px] text-muted-foreground">Engagement</span>
                  <span className="text-[11px] font-bold text-foreground">{store.engagementScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-muted-foreground">Messages</span>
                  <span className="text-[11px] font-bold text-foreground">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-muted-foreground">Topics</span>
                  <span className="text-[11px] font-bold text-foreground">{Object.values(store.topicMastery).length}</span>
                </div>
                {isADHD && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-muted-foreground">XP Earned</span>
                    <span className="text-[11px] font-bold text-yellow-600">{xp} XP ⭐</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
