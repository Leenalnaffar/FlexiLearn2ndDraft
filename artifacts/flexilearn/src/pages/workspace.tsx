import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Brain, Sparkles, Lightbulb,
  Youtube, Headphones, GraduationCap, Trophy,
  Zap, Clock, Shield, Star, BookOpen, User, AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useFlexiLearnStore, type AgentId } from "@/store";
import { extractTopics } from "@/lib/topic-extractor";
import { cn } from "@/lib/utils";

// ── TYPES ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant" | "attention";
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── FORMATTERS ───────────────────────────────────────────────────────────────

function renderLatex(content: string): string {
  // Inline LaTeX: $formula$ → styled span
  return content.replace(/\$([^$\n]+)\$/g, (_, formula) =>
    `<span class="inline-block font-mono bg-purple-50 border border-purple-200 text-purple-800 px-1.5 py-0.5 rounded text-[12px] mx-0.5">${formula}</span>`
  );
}

function formatMessage(content: string, style?: string): string {
  let out = content;

  // LaTeX for reading/writing
  if (style === "reading_writing") {
    out = renderLatex(out);
  }

  return out
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^## (.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1 text-foreground">$1</h3>')
    .replace(/\|(.+)\|/g, (row) => {
      const cells = row.split("|").filter(Boolean).map((c) => c.trim());
      return `<div class="flex gap-2 text-[11px] border-b border-gray-100 py-1">${cells.map((c, i) => `<span class="${i === 0 ? "w-24 font-semibold" : "flex-1"}">${c}</span>`).join("")}</div>`;
    })
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 underline hover:text-blue-800 break-all">$1</a>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function extractLinks(content: string, hostPattern: string, max = 2): Array<{ label: string; url: string }> {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const results: Array<{ label: string; url: string }> = [];
  let match;
  while ((match = regex.exec(content)) !== null && results.length < max) {
    if (match[2].includes(hostPattern)) {
      results.push({ label: match[1], url: match[2] });
    }
  }
  return results;
}

function stripMediaLines(content: string): string {
  // Remove lines that start with emoji media markers
  return content
    .split("\n")
    .filter((line) => !/^[🎬🎧]\s*\*\*/.test(line.trim()))
    .join("\n")
    .trim();
}

// ── MEDIA CARDS ──────────────────────────────────────────────────────────────

function GeneratedImage({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500">
        <Sparkles className="w-3.5 h-3.5 text-white" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI-Generated Visual</span>
      </div>
      {!loaded && (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Generating illustration...
        </div>
      )}
      <img
        src={url}
        alt="AI-generated educational illustration"
        className={cn("w-full object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0 h-0")}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function YouTubeCards({ links }: { links: Array<{ label: string; url: string }> }) {
  return (
    <div className="space-y-1.5 mb-3">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:opacity-90 group"
          style={{ backgroundColor: "#FF0000" }}
        >
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Youtube className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Watch Video {i + 1}</p>
            <p className="text-xs font-semibold text-white truncate">{link.label}</p>
          </div>
          <span className="ml-auto text-white/60 group-hover:text-white text-xs flex-shrink-0">▶</span>
        </a>
      ))}
    </div>
  );
}

function SpotifyCards({ links }: { links: Array<{ label: string; url: string }> }) {
  return (
    <div className="space-y-1.5 mb-3">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:opacity-90 group"
          style={{ backgroundColor: "#1DB954" }}
        >
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Listen · Episode {i + 1}</p>
            <p className="text-xs font-semibold text-white truncate">{link.label}</p>
          </div>
          <span className="ml-auto text-white/60 group-hover:text-white text-xs flex-shrink-0">🎧</span>
        </a>
      ))}
    </div>
  );
}

// ── KINESTHETIC FEEDBACK ──────────────────────────────────────────────────────

function TeachingAuditCard({ content }: { content: string }) {
  const gradeMatch = content.match(/\*\*Final Grade\*\*:\s*([A-F][+\-]?)/);
  const grade = gradeMatch ? gradeMatch[1] : "B";
  const gradeColors: Record<string, string> = {
    "A+": "#16a34a", A: "#22c55e", B: "#3B5BDB", C: "#f59e0b", D: "#f97316", F: "#ef4444",
  };
  const color = gradeColors[grade] ?? "#3B5BDB";
  return (
    <div className="rounded-2xl border-2 overflow-hidden shadow-md" style={{ borderColor: color }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: color }}>
        <Trophy className="w-5 h-5 text-white" />
        <div>
          <p className="text-white font-black text-sm">Teaching Audit Complete</p>
          <p className="text-white/70 text-[10px]">Alex's assessment of your teaching session</p>
        </div>
        <div className="ml-auto text-5xl font-black text-white leading-none">{grade}</div>
      </div>
      <div className="p-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMessage(content, "reading_writing") }} />
    </div>
  );
}

// ── ADHD COMPONENTS ───────────────────────────────────────────────────────────

function XPBar({ xp, gained }: { xp: number; gained: number }) {
  const levelXP = 500;
  const level = Math.floor(xp / levelXP) + 1;
  const progress = ((xp % levelXP) / levelXP) * 100;
  return (
    <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0" style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
      <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] font-black text-yellow-800">LVL {level}</span>
          <span className="text-[10px] text-yellow-700">
            {xp} XP {gained > 0 && <motion.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.5, duration: 0.5 }} className="text-green-600 font-black">+{gained}</motion.span>}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#fde68a" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

function FocusTimer({ secondsLeft }: { secondsLeft: number }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const pct = (secondsLeft / 300) * 100;
  const urgent = secondsLeft < 60;
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border",
      urgent ? "border-red-300 bg-red-50 text-red-700" : "border-orange-200 bg-orange-50 text-orange-700"
    )}>
      <Clock className={cn("w-3.5 h-3.5", urgent && "animate-pulse")} />
      <span>{mins}:{secs.toString().padStart(2, "0")}</span>
      <div className="w-12 h-1.5 rounded-full bg-orange-200 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", urgent ? "bg-red-500" : "bg-orange-500")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DopamineChallenge({ question, onAnswer, onSkip }: { question: string; onAnswer: (a: string) => void; onSkip: () => void }) {
  const [ans, setAns] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); onSkip(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onSkip]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
          <Shield className="w-6 h-6 text-white animate-pulse" />
          <div className="flex-1">
            <p className="text-white font-black text-sm">⚡ DOPAMINE CHALLENGE!</p>
            <p className="text-white/70 text-[10px]">5-minute sprint complete — answer to earn XP</p>
          </div>
          <div className="text-2xl font-black text-white">{timeLeft}s</div>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold text-foreground mb-3">{question}</p>
          <textarea
            autoFocus
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            placeholder="Type your answer..."
            className="w-full rounded-xl border border-border bg-gray-50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows={3}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={onSkip} className="flex-1 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:bg-gray-50 transition-all">
              Skip
            </button>
            <button
              onClick={() => ans.trim() && onAnswer(ans.trim())}
              disabled={!ans.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              Submit ⚡ +50 XP
            </button>
          </div>
        </div>
        <div className="h-1" style={{ background: "linear-gradient(90deg, #7c3aed, #2563eb)", width: `${(timeLeft / 30) * 100}%`, transition: "width 1s linear" }} />
      </div>
    </motion.div>
  );
}

function AttentionTriggerMessage({ topic }: { topic: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex gap-3 my-2"
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-orange-500">
        <AlertCircle className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 border-2 border-orange-300 bg-orange-50">
        <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider mb-1">⚡ Attention Trigger</p>
        <p className="text-sm font-semibold text-orange-800">
          Hey! You've been idle for 60 seconds. You were learning about{" "}
          <strong>{topic || "this topic"}</strong>. Ready to dive back in?
        </p>
      </div>
    </motion.div>
  );
}

// ── STARTERS ──────────────────────────────────────────────────────────────────

const KINESTHETIC_TOPICS = ["photosynthesis", "the French Revolution", "Newton's laws", "machine learning", "DNA replication", "the quadratic formula"];
const VISUAL_STARTERS = ["Visualise how black holes form", "Show me photosynthesis as a diagram", "Map out the water cycle visually", "Break down the human immune system", "Visualise how neural networks learn", "Map the causes of World War I"];
const AUDITORY_STARTERS = ["Explain gravity like a podcast", "Tell me the story of DNA discovery", "Walk me through how the internet works", "Explain evolution conversationally", "Tell me about the Big Bang", "Explain compound interest out loud"];
const RW_STARTERS = ["Explain how photosynthesis works", "What is the quadratic formula?", "How does DNA replication work?", "Explain Newton's three laws of motion", "What caused World War I?", "How does machine learning work?"];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [streamImageUrl, setStreamImageUrl] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // ADHD state
  const [dopamineSeconds, setDopamineSeconds] = useState(300); // 5-min sprint
  const [sprintActive, setSprintActive] = useState(false);
  const [dopamineActive, setDopamineActive] = useState(false);
  const [dopamineQuestion, setDopamineQuestion] = useState("");
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [attentionFired, setAttentionFired] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  // Kinesthetic
  const [teachingExchanges, setTeachingExchanges] = useState(0);
  const [showAuditBtn, setShowAuditBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const store = useFlexiLearnStore();
  const {
    profile, currentConversationId, updateAgent, resetAgents, setConversationId,
    addInteraction, incrementEngagement, recordTopicInteraction, addXP, xp,
    getActiveStyle, getActiveNeuro, setAccessibility, accessibility,
  } = store;

  const activeStyle = getActiveStyle();
  const activeNeuro = getActiveNeuro();
  const isKinesthetic = activeStyle === "kinesthetic";
  const isADHD = activeNeuro === "adhd";
  const isVisual = activeStyle === "visual";
  const isAuditory = activeStyle === "auditory";
  const isRW = activeStyle === "reading_writing";
  const isDyslexia = activeNeuro === "dyslexia";

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // ── Dyslexia auto-mode: apply OpenDyslexic + high contrast ────────────────
  useEffect(() => {
    if (isDyslexia) {
      setAccessibility({ dyslexicFont: true, highContrast: true, fontSize: 18, lineSpacing: 2 });
    }
  }, [isDyslexia]);

  // ── Init conversation ──────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        let convId = currentConversationId;
        if (!convId) {
          const res = await fetch(`${BASE}/api/openai/conversations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: profile ? `${profile.displayName}'s Session` : "Learning Session" }),
          });
          const conv = await res.json() as { id: number };
          convId = conv.id;
          setConversationId(convId);
        }
        const res = await fetch(`${BASE}/api/openai/conversations/${convId}/messages`);
        const msgs = await res.json() as Array<{ id: number; role: string; content: string; createdAt: string }>;
        setMessages(msgs.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.createdAt),
        })));
      } catch (e) {
        console.error("Failed to init conversation", e);
      } finally {
        setIsInitializing(false);
      }
    }
    void init();
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamContent]);

  // ── ADHD Sprint Timer (5 min → Dopamine Challenge) ────────────────────────
  useEffect(() => {
    if (!isADHD || !sprintActive) return;
    const tick = setInterval(() => {
      setDopamineSeconds((s) => {
        if (s <= 1) {
          clearInterval(tick);
          const lastTopic = Object.values(store.topicMastery)
            .sort((a, b) => b.interactions - a.interactions)[0]?.topic ?? "the topic you were studying";
          setDopamineQuestion(`5-minute sprint done! Quick check: Explain the most important thing you just learned about ${lastTopic} in one sentence.`);
          setDopamineActive(true);
          return 300;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [isADHD, sprintActive]);

  // ── ADHD Idle Detection (60s → Attention Trigger) ─────────────────────────
  useEffect(() => {
    if (!isADHD) return;
    const idle = setInterval(() => {
      const elapsed = Date.now() - lastInteraction;
      if (elapsed > 60_000 && !isStreaming && messages.length > 0 && !attentionFired) {
        setAttentionFired(true);
        const lastTopic = Object.values(store.topicMastery)
          .sort((a, b) => b.interactions - a.interactions)[0]?.topic ?? "this topic";
        setMessages((prev) => [
          ...prev,
          {
            id: `attention-${Date.now()}`,
            role: "attention",
            content: lastTopic,
            timestamp: new Date(),
          },
        ]);
      }
    }, 5000);
    return () => clearInterval(idle);
  }, [isADHD, lastInteraction, isStreaming, messages.length, attentionFired]);

  // ── Agent orchestration ────────────────────────────────────────────────────
  async function runAgentOrchestration(question: string) {
    resetAgents();
    const styleLabel = { visual: "Visual", auditory: "Auditory", kinesthetic: "Kinesthetic", reading_writing: "R/W" }[activeStyle] ?? "Visual";
    const profileLabel = { none: "Standard", adhd: "ADHD", dyslexia: "Dyslexia", autism: "Autism" }[activeNeuro] ?? "Standard";
    const update = (id: AgentId, p: Parameters<typeof updateAgent>[1]) => updateAgent(id, p);

    update("profiling", { status: "active", progressPercent: 20, currentTask: `Analysing ${styleLabel} learner profile...` });
    await delay(600);
    update("profiling", { progressPercent: 70, currentTask: "Calibrating modality enforcement..." });
    await delay(600);
    update("profiling", { status: "complete", progressPercent: 100, currentTask: `LOCKED: ${styleLabel} · ${profileLabel}`, lastDecision: `Strict ${styleLabel} modality active` });

    update("planning", { status: "active", progressPercent: 15, currentTask: "Routing to modality pipeline..." });
    await delay(500);
    update("planning", { progressPercent: 60, currentTask: `${styleLabel} logic gate — enforcing rules...` });
    await delay(700);
    update("planning", { status: "complete", progressPercent: 100, currentTask: "Modality router confirmed", lastDecision: isVisual ? "DALL-E + YouTube enforced" : isKinesthetic ? "Protege Protocol active" : isAuditory ? "Podcast-first enforced" : "Academic depth enforced" });

    update("content", { status: "active", progressPercent: 10, currentTask: isVisual ? "Generating DALL-E illustration..." : "Generating content..." });
  }

  async function finaliseAgents(responseLength: number) {
    const overlay = { none: "balanced", adhd: "ADHD chunked+XP", dyslexia: "2-sentence chunks", autism: "direct literal" }[activeNeuro] ?? "balanced";
    updateAgent("content", { status: "complete", progressPercent: 100, currentTask: `${responseLength} chars delivered`, output: "Content streamed" });
    updateAgent("neuroadapt", { status: "active", progressPercent: 30, currentTask: `Applying ${overlay}...` });
    await delay(600);
    updateAgent("neuroadapt", { status: "complete", progressPercent: 100, currentTask: "Overlay applied", lastDecision: "Format confirmed" });
    updateAgent("observation", { status: "active", progressPercent: 40, currentTask: "Recording engagement..." });
    await delay(500);
    updateAgent("observation", { status: "complete", progressPercent: 100, currentTask: "Interaction logged", lastDecision: "Engagement positive" });
    updateAgent("reflection", { status: "active", progressPercent: 30, currentTask: "Evaluating modality effectiveness..." });
    await delay(600);
    updateAgent("reflection", { status: "complete", progressPercent: 100, currentTask: "Modality enforced correctly", lastDecision: "Maintain current routing" });
  }

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage(text?: string) {
    const question = (text ?? input).trim();
    if (!question || isStreaming || !currentConversationId) return;

    setInput("");
    setIsStreaming(true);
    setStreamContent("");
    setStreamImageUrl(null);
    setLastInteraction(Date.now());
    setAttentionFired(false);
    if (isADHD && !sprintActive) setSprintActive(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    const topics = extractTopics(question);
    topics.forEach(({ topic, subject, scoreBoost }) => recordTopicInteraction(topic, subject, scoreBoost));
    addInteraction(question, topics.map((t) => t.topic));
    incrementEngagement(8);

    void runAgentOrchestration(question);
    await delay(1800);

    let full = "";
    let imageUrl: string | undefined;
    try {
      const res = await fetch(
        `${BASE}/api/openai/conversations/${currentConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: question, learningStyle: activeStyle, neuroProfile: activeNeuro }),
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
            const data = JSON.parse(line.slice(6)) as { content?: string; imageUrl?: string; done?: boolean; error?: string };
            if (data.imageUrl) {
              imageUrl = data.imageUrl;
              setStreamImageUrl(data.imageUrl);
            }
            if (data.content) {
              full += data.content;
              setStreamContent(full);
              progress = Math.min(95, progress + 2);
              updateAgent("content", { progressPercent: progress, currentTask: `Streaming... (${full.length} chars)` });
            }
            if (data.done || data.error) break;
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Stream failed", e);
      full = "I'm having trouble connecting right now. Please try again.";
    }

    const assistantMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: full, timestamp: new Date(), imageUrl };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreamContent("");
    setStreamImageUrl(null);
    setIsStreaming(false);

    if (isADHD) {
      const gained = 25;
      addXP(gained);
      setXpGained(gained);
      setTimeout(() => setXpGained(0), 2500);
    }

    if (isKinesthetic) {
      const isAudit = question.toLowerCase().includes("grade me") || question.toLowerCase().includes("audit") || question.toLowerCase().includes("feedback");
      if (!isAudit) {
        const newCount = teachingExchanges + 1;
        setTeachingExchanges(newCount);
        if (newCount >= 3) setShowAuditBtn(true);
      } else {
        setShowAuditBtn(false);
        setTeachingExchanges(0);
      }
    }

    void finaliseAgents(full.length);
    extractTopics(full).forEach(({ topic, subject }) => recordTopicInteraction(topic, subject, 6));
  }

  function handleDopamineAnswer(answer: string) {
    setDopamineActive(false);
    addXP(50);
    setXpGained(50);
    setTimeout(() => setXpGained(0), 2500);
    void sendMessage(`Dopamine Challenge Answer: ${answer}`);
    setDopamineSeconds(300);
  }

  function handleDopamineSkip() {
    setDopamineActive(false);
    setDopamineSeconds(300);
  }

  function requestAudit() {
    void sendMessage("grade me — please give me my Teaching Audit now");
    setShowAuditBtn(false);
  }

  // ── Render assistant bubble ────────────────────────────────────────────────
  function renderAssistantBubble(msg: Message) {
    const content = msg.content;
    const isAudit = content.includes("Teaching Audit") && content.includes("Final Grade");

    if (isAudit) {
      return (
        <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br from-yellow-400 to-orange-500">
            <Trophy className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 max-w-[88%]">
            <TeachingAuditCard content={content} />
          </div>
        </motion.div>
      );
    }

    const ytLinks = isVisual ? extractLinks(content, "youtube", 2) : [];
    const spLinks = isAuditory ? extractLinks(content, "spotify", 2) : [];
    const cleanContent = (ytLinks.length > 0 || spLinks.length > 0) ? stripMediaLines(content) : content;

    const avatarBg = isKinesthetic ? "linear-gradient(135deg, #f59e0b, #ef4444)" : isAuditory ? "linear-gradient(135deg, #1DB954, #15803d)" : isVisual ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #3B5BDB, #6366f1)";
    const avatarIcon = isKinesthetic ? <GraduationCap className="w-3.5 h-3.5 text-white" /> : isAuditory ? <Headphones className="w-3.5 h-3.5 text-white" /> : isVisual ? <Youtube className="w-3.5 h-3.5 text-white" /> : <BookOpen className="w-3.5 h-3.5 text-white" />;

    const bubbleClass = isDyslexia
      ? "max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-4 bg-gray-900 border border-gray-700 shadow-sm"
      : "max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 bg-white border border-border shadow-sm";
    const textClass = isDyslexia ? "text-base text-gray-100 leading-loose" : "text-sm text-foreground leading-relaxed";

    return (
      <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: avatarBg }}>
          {avatarIcon}
        </div>
        <div className={bubbleClass}>
          {isKinesthetic && <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1.5">Alex · Student</p>}
          {msg.imageUrl && <GeneratedImage url={msg.imageUrl} />}
          {ytLinks.length > 0 && <YouTubeCards links={ytLinks} />}
          {spLinks.length > 0 && <SpotifyCards links={spLinks} />}
          <div className={textClass} dangerouslySetInnerHTML={{ __html: formatMessage(cleanContent, activeStyle) }} />
          <p className={cn("text-[10px] mt-1.5", isDyslexia ? "text-gray-500" : "text-muted-foreground")}>
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const topTopics = Object.values(store.topicMastery).sort((a, b) => b.interactions - a.interactions).slice(0, 4);
  const lastTopicName = topTopics[0]?.topic ?? "this topic";

  const modeLabel = isKinesthetic ? "Protege Protocol" : isVisual ? "Visual Map Mode" : isAuditory ? "Podcast Mode" : "Academic Depth";
  const modeGradient = isKinesthetic ? "linear-gradient(135deg, #f59e0b, #ef4444)" : isVisual ? "linear-gradient(135deg, #ef4444, #dc2626)" : isAuditory ? "linear-gradient(135deg, #1DB954, #15803d)" : "linear-gradient(135deg, #3B5BDB, #6366f1)";
  const modeIcon = isKinesthetic ? <GraduationCap className="w-4 h-4 text-white" /> : isVisual ? <Youtube className="w-4 h-4 text-white" /> : isAuditory ? <Headphones className="w-4 h-4 text-white" /> : <BookOpen className="w-4 h-4 text-white" />;

  const inputPlaceholder = isKinesthetic
    ? "Tell Alex the topic — then start teaching. He's waiting..."
    : isVisual
    ? "What concept to visualise? (DALL-E illustration + 2 YouTube links guaranteed)"
    : isAuditory
    ? "What to learn by listening? (2 Spotify links + podcast-style response)"
    : "Ask any question — academic depth with LaTeX + bibliography...";

  const starterPrompts = isVisual ? VISUAL_STARTERS : isAuditory ? AUDITORY_STARTERS : RW_STARTERS;

  const bgStyle = isDyslexia ? { backgroundColor: "#111827" } : { backgroundColor: "#F7FAFC" };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Start Learning" noPadding>
      {dopamineActive && (
        <DopamineChallenge
          question={dopamineQuestion}
          onAnswer={handleDopamineAnswer}
          onSkip={handleDopamineSkip}
        />
      )}

      <div className="flex h-full">
        <div className="flex flex-col flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: modeGradient }}>
                {modeIcon}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">{modeLabel}</h2>
                <p className="text-[11px] text-muted-foreground capitalize">{activeStyle.replace("_", "/")} · {activeNeuro === "none" ? "Standard" : activeNeuro.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isADHD && sprintActive && <FocusTimer secondsLeft={dopamineSeconds} />}
              {isKinesthetic && showAuditBtn && (
                <button onClick={requestAudit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
                  <Trophy className="w-3.5 h-3.5" /> Get Teaching Audit
                </button>
              )}
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", isStreaming ? "bg-blue-400 animate-pulse" : "bg-green-400")} />
                <span className="text-[11px] text-muted-foreground">{isStreaming ? (isVisual ? "Generating image + content..." : "Agents active...") : "Ready"}</span>
              </div>
            </div>
          </div>

          {/* ADHD XP Bar */}
          {isADHD && <XPBar xp={xp} gained={xpGained} />}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={bgStyle}>
            {isInitializing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Initialising workspace...</p>
                </div>
              </div>
            ) : messages.length === 0 && !isStreaming ? (
              isKinesthetic ? (
                // Kinesthetic empty state
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center px-4">
                  <div>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#f59e0b20" }}>
                      <GraduationCap className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-base font-black text-foreground">The Protege Protocol</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">You're the teacher. Alex is stuck and confused. Pick a topic and explain it — the better you teach, the higher your Teaching Audit grade.</p>
                  </div>
                  <div className="w-full max-w-xs space-y-2">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Choose a topic to teach</p>
                    <div className="grid grid-cols-2 gap-2">
                      {KINESTHETIC_TOPICS.map((t) => (
                        <button key={t} onClick={() => void sendMessage(`I want to teach you about ${t}`)} className="text-left p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all text-xs font-semibold text-amber-800">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Standard empty state
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                  <div>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: isVisual ? "#FF000015" : isAuditory ? "#1DB95415" : "#3B5BDB15" }}>
                      {isVisual ? <Youtube className="w-7 h-7 text-red-500" /> : isAuditory ? <Headphones className="w-7 h-7 text-green-600" /> : <Sparkles className="w-7 h-7" style={{ color: "#3B5BDB" }} />}
                    </div>
                    <h3 className="text-base font-bold text-foreground">What would you like to learn?</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      {isVisual ? "Every response: DALL-E illustration + 2 YouTube links + concept map (under 80 words)." : isAuditory ? "Every response: 2 Spotify links + podcast-style prose + verbal summary." : "Every response: full academic depth with LaTeX, technical analysis, and bibliography."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                    {starterPrompts.map((prompt) => (
                      <button key={prompt} onClick={() => void sendMessage(prompt)} className="text-left p-3 rounded-xl border border-border bg-white hover:bg-blue-50 hover:border-blue-200 transition-all text-xs text-foreground font-medium group">
                        <span className="text-muted-foreground group-hover:text-blue-600 transition-colors text-[10px] block mb-0.5">Try asking:</span>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    if (msg.role === "attention") {
                      return <AttentionTriggerMessage key={msg.id} topic={msg.content} />;
                    }
                    if (msg.role === "user") {
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex gap-3 flex-row-reverse">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-600">
                            <User className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className={cn("max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3", isDyslexia && "text-base leading-loose")}>
                            {isKinesthetic && <p className="text-[10px] font-black text-blue-200 uppercase tracking-wider mb-1">You · Teacher</p>}
                            <p className={isDyslexia ? "text-base leading-loose" : "text-sm leading-relaxed"}>{msg.content}</p>
                            <p className="text-[10px] text-blue-200 mt-1.5">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </motion.div>
                      );
                    }
                    return renderAssistantBubble(msg);
                  })}
                </AnimatePresence>

                {/* Streaming bubble */}
                {isStreaming && (streamContent || streamImageUrl) && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: modeGradient }}>
                      {modeIcon}
                    </div>
                    <div className={isDyslexia ? "max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-4 bg-gray-900 border border-blue-700 shadow-sm" : "max-w-[80%] bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"}>
                      {streamImageUrl && <GeneratedImage url={streamImageUrl} />}
                      <div className={isDyslexia ? "text-base text-gray-100 leading-loose" : "text-sm text-foreground leading-relaxed"} dangerouslySetInnerHTML={{ __html: formatMessage(streamContent, activeStyle) }} />
                      <span className="inline-block w-1 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                    </div>
                  </motion.div>
                )}

                {isStreaming && !streamContent && !streamImageUrl && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: modeGradient }}>
                      {modeIcon}
                    </div>
                    <div className={isDyslexia ? "bg-gray-900 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm" : "bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"}>
                      <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        <span className={cn("text-xs ml-1", isDyslexia ? "text-gray-400" : "text-muted-foreground")}>
                          {isVisual ? "Generating illustration..." : isKinesthetic ? "Alex is thinking..." : "Agents working..."}
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
          <div className={cn("px-6 py-4 border-t border-border flex-shrink-0", isDyslexia ? "bg-gray-900" : "bg-white")}>
            {topTopics.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground">Tracking:</span>
                {topTopics.map((t) => (
                  <span key={t.topic} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#3B5BDB15", color: "#3B5BDB" }}>
                    {t.topic} {t.score}%
                  </span>
                ))}
              </div>
            )}
            {isKinesthetic && showAuditBtn && (
              <div className="flex items-center gap-2 mb-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs text-amber-700 font-semibold">{teachingExchanges} teaching exchanges — ready for your Teaching Audit?</span>
                <button onClick={requestAudit} className="ml-auto text-xs font-black text-white px-2.5 py-1 rounded-full transition-all" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
                  Audit Me
                </button>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); setLastInteraction(Date.now()); setAttentionFired(false); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                placeholder={inputPlaceholder}
                rows={1}
                disabled={isStreaming || !currentConversationId}
                className={cn(
                  "flex-1 resize-none rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-muted-foreground/60 disabled:opacity-50",
                  isDyslexia ? "bg-gray-800 text-gray-100 border-gray-600 text-base" : "bg-gray-50"
                )}
                style={{ minHeight: "40px", maxHeight: "120px" }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
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
            <p className={cn("text-[10px] mt-1.5", isDyslexia ? "text-gray-500" : "text-muted-foreground")}>
              Press Enter to send · Shift+Enter for new line
              {isADHD && <span className="ml-2 text-yellow-600 font-semibold">⚡ {Math.floor(dopamineSeconds / 60)}:{(dopamineSeconds % 60).toString().padStart(2, "0")} to next Dopamine Challenge</span>}
            </p>
          </div>
        </div>

        {/* Right context panel */}
        <div className={cn("w-64 flex-shrink-0 border-l border-border flex flex-col overflow-y-auto", isDyslexia ? "bg-gray-900" : "bg-white")}>
          <div className={cn("px-4 py-3 border-b border-border", isDyslexia && "border-gray-700")}>
            <h3 className={cn("text-xs font-bold flex items-center gap-1.5", isDyslexia ? "text-gray-200" : "text-foreground")}>
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Learning Context
            </h3>
          </div>
          <div className="p-3 space-y-3 flex-1">

            {/* Mode card */}
            <div className="rounded-lg overflow-hidden border border-border">
              <div className="px-3 py-2 flex items-center gap-2" style={{ background: modeGradient }}>
                {modeIcon}
                <span className="text-[11px] font-black text-white">{modeLabel}</span>
              </div>
              <div className={cn("p-3 space-y-1.5", isDyslexia && "bg-gray-800")}>
                {isVisual && (
                  <>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🎨 DALL-E image per concept</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🎬 2 YouTube links enforced</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>📏 Max 3 bullets · 80 words</p>
                  </>
                )}
                {isAuditory && (
                  <>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🎧 2 Spotify episodes enforced</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🎙️ Podcast script format</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🎤 Verbal summary at end</p>
                  </>
                )}
                {isKinesthetic && (
                  <>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🎓 You teach · Alex learns</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🤔 Probing confusion questions</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>📋 Teaching Audit after 3+ turns</p>
                    {teachingExchanges > 0 && <p className="text-[11px] font-black text-amber-500">{teachingExchanges} exchanges completed</p>}
                  </>
                )}
                {isRW && (
                  <>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>📚 Academic depth format</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>📐 LaTeX formula rendering</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🔗 Bibliography on every response</p>
                  </>
                )}
                {isADHD && (
                  <>
                    <div className={cn("border-t mt-1.5 pt-1.5", isDyslexia ? "border-gray-600" : "border-border")} />
                    <p className={cn("text-[11px] flex items-center gap-1", isDyslexia ? "text-gray-300" : "text-foreground")}>
                      <Zap className="w-3 h-3 text-yellow-500" /> XP: {xp} pts · Level {Math.floor(xp / 500) + 1}
                    </p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>⚡ Dopamine Challenge every 5 min</p>
                    <p className={cn("text-[11px]", isDyslexia ? "text-gray-300" : "text-foreground")}>🔔 Attention Trigger at 60s idle</p>
                  </>
                )}
                {isDyslexia && (
                  <>
                    <div className={cn("border-t mt-1.5 pt-1.5", "border-gray-600")} />
                    <p className="text-[11px] text-gray-300">📝 OpenDyslexic font active</p>
                    <p className="text-[11px] text-gray-300">🌑 High-contrast dark mode</p>
                    <p className="text-[11px] text-gray-300">📦 2-sentence chunks enforced</p>
                  </>
                )}
              </div>
            </div>

            {/* Topics */}
            <div className={cn("rounded-lg border p-3", isDyslexia ? "border-gray-700 bg-gray-800" : "border-border")}>
              <p className={cn("text-[10px] font-semibold uppercase tracking-widest mb-2", isDyslexia ? "text-gray-400" : "text-muted-foreground")}>Topics Tracked</p>
              {Object.values(store.topicMastery).length === 0 ? (
                <p className={cn("text-[11px]", isDyslexia ? "text-gray-500" : "text-muted-foreground/60")}>Ask a question to start tracking</p>
              ) : (
                <div className="space-y-2">
                  {Object.values(store.topicMastery).sort((a, b) => b.interactions - a.interactions).slice(0, 6).map((t) => (
                    <div key={t.topic}>
                      <div className="flex justify-between mb-0.5">
                        <span className={cn("text-[11px] font-medium truncate flex-1", isDyslexia ? "text-gray-200" : "text-foreground")}>{t.topic}</span>
                        <span className={cn("text-[10px] ml-1", isDyslexia ? "text-gray-400" : "text-muted-foreground")}>{t.score}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: isDyslexia ? "#374151" : "#f3f4f6" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.score}%`, backgroundColor: t.score >= 75 ? "#22c55e" : t.score >= 40 ? "#3B5BDB" : "#f59e0b" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session */}
            <div className={cn("rounded-lg border p-3", isDyslexia ? "border-gray-700 bg-gray-800" : "border-border")}>
              <p className={cn("text-[10px] font-semibold uppercase tracking-widest mb-2", isDyslexia ? "text-gray-400" : "text-muted-foreground")}>Session</p>
              <div className="space-y-1.5">
                {[
                  ["Engagement", store.engagementScore],
                  ["Messages", messages.filter((m) => m.role !== "attention").length],
                  ["Topics", Object.values(store.topicMastery).length],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className={cn("text-[11px]", isDyslexia ? "text-gray-400" : "text-muted-foreground")}>{label}</span>
                    <span className={cn("text-[11px] font-bold", isDyslexia ? "text-gray-200" : "text-foreground")}>{val}</span>
                  </div>
                ))}
                {isADHD && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-muted-foreground">XP Earned</span>
                    <span className="text-[11px] font-black text-yellow-500">{xp} ⭐</span>
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
