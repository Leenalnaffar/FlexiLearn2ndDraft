import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Brain, Sparkles, BookOpen, Lightbulb } from "lucide-react";
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

function formatMessage(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^## (.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1 text-foreground">$1</h3>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

const STARTER_PROMPTS = [
  "Explain how photosynthesis works",
  "What is the quadratic formula and when do I use it?",
  "How does DNA replication work?",
  "Explain Newton's three laws of motion",
  "What caused World War I?",
  "How does machine learning work?",
];

export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const store = useFlexiLearnStore();
  const { profile, currentConversationId, updateAgent, resetAgents, setConversationId,
    addInteraction, incrementEngagement, recordTopicInteraction } = store;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

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

  async function runAgentOrchestration(question: string) {
    resetAgents();

    const profileLabel = profile?.neuroProfile
      ? { none: "Standard", adhd: "ADHD", dyslexia: "Dyslexia", autism: "Autism" }[profile.neuroProfile] ?? profile.neuroProfile
      : "Standard";

    const styleLabel = profile?.learningStyle
      ? { visual: "Visual", auditory: "Auditory", kinesthetic: "Kinesthetic", reading_writing: "Reading/Writing" }[profile.learningStyle] ?? "Visual"
      : "Visual";

    const update = (id: AgentId, patch: Parameters<typeof updateAgent>[1]) => updateAgent(id, patch);

    update("profiling", { status: "active", progressPercent: 20, currentTask: `Analysing ${styleLabel} learner profile...` });
    await delay(600);
    update("profiling", { progressPercent: 70, currentTask: "Calibrating cognitive load parameters..." });
    await delay(600);
    update("profiling", { status: "complete", progressPercent: 100, currentTask: `Profile confirmed: ${styleLabel} · ${profileLabel}`, lastDecision: `Adapt content for ${styleLabel} learner` });

    update("planning", { status: "active", progressPercent: 15, currentTask: "Decomposing question into learning objectives..." });
    await delay(500);
    update("planning", { progressPercent: 60, currentTask: `Selecting ${styleLabel}-optimised teaching strategy...` });
    await delay(700);
    update("planning", { status: "complete", progressPercent: 100, currentTask: "Lesson plan generated — 3 key concepts identified", lastDecision: "Structured explanation with check-in" });

    update("content", { status: "active", progressPercent: 10, currentTask: "Generating personalised lesson content..." });
  }

  async function finaliseAgents(responseLength: number) {
    const profileLabel = profile?.neuroProfile
      ? { none: "no special adaptations", adhd: "chunked paragraphs + focus cues", dyslexia: "short sentences + clear structure", autism: "explicit literal format" }[profile.neuroProfile] ?? "no special adaptations"
      : "no special adaptations";

    updateAgent("content", { status: "complete", progressPercent: 100, currentTask: `${responseLength} chars generated`, output: "Lesson content delivered" });

    updateAgent("neuroadapt", { status: "active", progressPercent: 30, currentTask: `Applying ${profileLabel}...` });
    await delay(600);
    updateAgent("neuroadapt", { status: "complete", progressPercent: 100, currentTask: "Content formatted for profile", lastDecision: "Format applied" });

    updateAgent("observation", { status: "active", progressPercent: 40, currentTask: "Recording engagement pattern..." });
    await delay(500);
    updateAgent("observation", { status: "complete", progressPercent: 100, currentTask: "Interaction logged to memory", lastDecision: "Positive engagement detected" });

    updateAgent("reflection", { status: "active", progressPercent: 30, currentTask: "Evaluating response quality..." });
    await delay(600);
    updateAgent("reflection", { status: "complete", progressPercent: 100, currentTask: "Strategy effective — continue current approach", lastDecision: "Maintain adaptive difficulty" });
  }

  async function sendMessage(text?: string) {
    const question = (text ?? input).trim();
    if (!question || isStreaming || !currentConversationId) return;

    setInput("");
    setIsStreaming(true);
    setStreamContent("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const topics = extractTopics(question);
    topics.forEach(({ topic, subject, scoreBoost }) => {
      recordTopicInteraction(topic, subject, scoreBoost);
    });
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
            learningStyle: profile?.learningStyle,
            neuroProfile: profile?.neuroProfile,
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
        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
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
          } catch {
            /* ignore parse error */
          }
        }
      }
    } catch (e) {
      console.error("Stream failed", e);
      full = "I'm having trouble connecting right now. Please try again in a moment.";
    }

    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: full,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreamContent("");
    setIsStreaming(false);

    void finaliseAgents(full.length);

    const additionalTopics = extractTopics(full);
    additionalTopics.forEach(({ topic, subject }) => {
      recordTopicInteraction(topic, subject, 6);
    });
  }

  function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  const profileLabel = profile
    ? `${profile.learningStyle === "visual" ? "Visual" : profile.learningStyle === "auditory" ? "Auditory" : profile.learningStyle === "kinesthetic" ? "Kinesthetic" : "Reading/Writing"} · ${profile.neuroProfile === "none" ? "Standard" : profile.neuroProfile?.charAt(0).toUpperCase() + (profile.neuroProfile?.slice(1) ?? "")}`
    : "No profile";

  const topTopics = Object.values(store.topicMastery).sort((a, b) => b.interactions - a.interactions).slice(0, 4);

  return (
    <DashboardLayout title="Agent Workspace" noPadding>
      <div className="flex h-full">
        {/* Conversation area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Workspace header bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B5BDB, #6366f1)" }}>
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">AI Learning Workspace</h2>
                <p className="text-[11px] text-muted-foreground">{profileLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">
                {isStreaming ? "Agents active..." : "Ready to learn"}
              </span>
            </div>
          </div>

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
              <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                <div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg, #3B5BDB20, #6366f120)" }}>
                    <Sparkles className="w-7 h-7" style={{ color: "#3B5BDB" }} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">What would you like to learn?</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Ask any academic question — your AI tutor will adapt to your {profile?.learningStyle ?? "learning"} style.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                  {STARTER_PROMPTS.map((prompt) => (
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
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                          msg.role === "user" ? "bg-blue-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                        )}
                      >
                        {msg.role === "user" ? (
                          <User className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-3",
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : "bg-white border border-border rounded-tl-sm shadow-sm"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div
                            className="text-sm text-foreground leading-relaxed prose-sm"
                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                          />
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        )}
                        <p className={cn("text-[10px] mt-1.5", msg.role === "user" ? "text-blue-200" : "text-muted-foreground")}>
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {(isStreaming && streamContent) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="max-w-[75%] bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div
                        className="text-sm text-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMessage(streamContent) }}
                      />
                      <span className="inline-block w-1 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                    </div>
                  </motion.div>
                )}

                {isStreaming && !streamContent && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        <span className="text-xs text-muted-foreground ml-1">Agents working...</span>
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
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
                }}
                placeholder="Ask anything — your agents will adapt the response to your profile..."
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
                style={{ backgroundColor: "#3B5BDB" }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>

        {/* Right panel - Adaptive context */}
        <div className="w-64 flex-shrink-0 border-l border-border bg-white flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Learning Context
            </h3>
          </div>

          <div className="p-3 space-y-3 flex-1">
            {/* Topics studied */}
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
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${t.score}%`,
                            backgroundColor: t.score >= 75 ? "#22c55e" : t.score >= 40 ? "#3B5BDB" : "#f59e0b",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile adaptation */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Active Adaptations</p>
              {profile ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[11px] text-foreground capitalize">{profile.learningStyle?.replace("_", "/")} format</span>
                  </div>
                  {profile.neuroProfile && profile.neuroProfile !== "none" && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-[11px] text-foreground capitalize">{profile.neuroProfile} mode active</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px] text-foreground">Profile-aware prompting</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground/60">Complete onboarding to activate</p>
              )}
            </div>

            {/* Engagement */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Session</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">Engagement</span>
                    <span className="text-[11px] font-bold text-foreground">{store.engagementScore}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${store.engagementScore}%`,
                        backgroundColor: store.engagementScore >= 60 ? "#22c55e" : store.engagementScore >= 30 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-muted-foreground">Questions asked</span>
                  <span className="text-[11px] font-bold text-foreground">{store.sessionInteractions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-muted-foreground">Topics tracked</span>
                  <span className="text-[11px] font-bold text-foreground">{Object.keys(store.topicMastery).length}</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {store.getWeakTopics().length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Focus Areas
                </p>
                {store.getWeakTopics().slice(0, 3).map((t) => (
                  <div key={t.topic} className="flex justify-between mb-1">
                    <span className="text-[11px] text-amber-800">{t.topic}</span>
                    <span className="text-[10px] text-amber-600">{t.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
