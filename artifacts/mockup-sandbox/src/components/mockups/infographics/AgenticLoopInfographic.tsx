export default function AgenticLoopInfographic() {
  const NAVY = "#1A202C";
  const BLUE = "#3B5BDB";
  const CREAM = "#F7FAFC";
  const SLATE = "#2D3748";
  const MUTED = "#718096";

  const loopStages = [
    {
      step: "01",
      label: "PLAN",
      icon: "🗺",
      color: "#3B5BDB",
      bg: "#EBF4FF",
      agents: ["Profiling Agent", "Planning Agent"],
      desc: "Diagnose learner profile & decompose topic into objectives",
    },
    {
      step: "02",
      label: "ACT",
      icon: "⚡",
      color: "#7C3AED",
      bg: "#F5F3FF",
      agents: ["Content Agent", "NeuroAdapt Agent"],
      desc: "Generate adaptive content & apply neuro-profile formatting",
    },
    {
      step: "03",
      label: "OBSERVE",
      icon: "👁",
      color: "#059669",
      bg: "#ECFDF5",
      agents: ["Observation Agent"],
      desc: "Track engagement, topic mastery signals & learner response",
    },
    {
      step: "04",
      label: "REFLECT",
      icon: "🔄",
      color: "#D97706",
      bg: "#FFFBEB",
      agents: ["Reflection Agent"],
      desc: "Score performance, update memory & calibrate next cycle",
    },
  ];

  const agents = [
    { id: "profiling", name: "Profiling Agent", icon: "🧬", stage: "PLAN", role: "Reads learner style & neuro-profile from Zustand store. Sets the cognitive context for all downstream agents.", color: "#3B5BDB" },
    { id: "planning", name: "Planning Agent", icon: "📐", stage: "PLAN", role: "Breaks the user's question into structured learning objectives and selects the optimal teaching strategy.", color: "#3B5BDB" },
    { id: "content", name: "Content Agent", icon: "✨", stage: "ACT", role: "Streams GPT-generated lesson content via SSE. Enforces strict modality rules (Visual/Auditory/Kinesthetic/R-W).", color: "#7C3AED" },
    { id: "neuroadapt", name: "NeuroAdapt Agent", icon: "🧠", stage: "ACT", role: "Reformats output for the active neuro-profile. Controls timers, font, spacing, contrast & motion settings.", color: "#7C3AED" },
    { id: "observation", name: "Observation Agent", icon: "📊", stage: "OBSERVE", role: "Monitors engagement score, idle time, XP gains, and topic mastery changes in real time.", color: "#059669" },
    { id: "reflection", name: "Reflection Agent", icon: "💡", stage: "REFLECT", role: "Scores the session, updates the global knowledge store, and queues calibration for the next learning loop.", color: "#D97706" },
  ];

  const neuroProfiles = [
    {
      label: "Standard",
      icon: "⚖",
      color: "#3B5BDB",
      bg: "#EBF4FF",
      border: "#3B5BDB",
      features: [
        { icon: "📝", text: "Balanced content density" },
        { icon: "🎨", text: "Default visual theme" },
        { icon: "⏱", text: "Flexible pacing" },
        { icon: "🔀", text: "Mixed modalities" },
        { icon: "📖", text: "Full reading length" },
      ],
      badge: "DEFAULT",
      badgeColor: "#3B5BDB",
    },
    {
      label: "ADHD",
      icon: "⚡",
      color: "#7C3AED",
      bg: "#F5F3FF",
      border: "#7C3AED",
      features: [
        { icon: "⏱", text: "25-min Focus Sprint timer" },
        { icon: "🧩", text: "Chunked micro-lessons (3 bullets max)" },
        { icon: "🏆", text: "XP bar + dopamine rewards" },
        { icon: "🔔", text: "60s idle → Attention Trigger" },
        { icon: "🎯", text: "One concept at a time" },
      ],
      badge: "FOCUS MODE",
      badgeColor: "#7C3AED",
    },
    {
      label: "Dyslexia",
      icon: "📝",
      color: "#B45309",
      bg: "#FFFBEB",
      border: "#D97706",
      features: [
        { icon: "🔤", text: "OpenDyslexic font auto-applied" },
        { icon: "🌗", text: "High-contrast dark theme" },
        { icon: "↔", text: "Increased letter & word spacing" },
        { icon: "🔊", text: "Text-to-speech placeholders" },
        { icon: "📏", text: "Short paragraphs, wide margins" },
      ],
      badge: "READ ASSIST",
      badgeColor: "#B45309",
    },
    {
      label: "Autism",
      icon: "🔍",
      color: "#065F46",
      bg: "#ECFDF5",
      border: "#059669",
      features: [
        { icon: "🧹", text: "Minimalist UI — no animations" },
        { icon: "🗺", text: "Clear progress roadmap visible" },
        { icon: "🚫", text: "No flashing or motion effects" },
        { icon: "📋", text: "Explicit step-by-step structure" },
        { icon: "🔁", text: "Predictable, consistent layout" },
      ],
      badge: "STRUCTURE MODE",
      badgeColor: "#065F46",
    },
  ];

  return (
    <div
      style={{
        width: 1050,
        background: CREAM,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: NAVY,
      }}
    >
      {/* ── HERO HEADER ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #2D3748 60%, #1E3A8A 100%)`,
          padding: "48px 56px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative circles */}
        {[
          { w: 320, h: 320, top: -80, right: -60, opacity: 0.06 },
          { w: 180, h: 180, top: 20, right: 120, opacity: 0.05 },
          { w: 100, h: 100, bottom: -30, left: 400, opacity: 0.07 },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: c.w,
              height: c.h,
              borderRadius: "50%",
              background: "#fff",
              top: c.top,
              right: c.right,
              bottom: c.bottom,
              left: c.left,
              opacity: c.opacity,
            }}
          />
        ))}

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: BLUE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🎓
            </div>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, letterSpacing: 3 }}>
              FLEXILEARN · MULTI-AGENT ARCHITECTURE
            </span>
          </div>

          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            The Agentic Learning Loop
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", maxWidth: 560, lineHeight: 1.6 }}>
            6 specialised AI agents orchestrate every session in a continuous{" "}
            <strong style={{ color: "rgba(255,255,255,0.85)" }}>Plan → Act → Observe → Reflect</strong>{" "}
            cycle — adapting in real time to each learner's cognitive profile.
          </p>

          {/* stat pills */}
          <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
            {[
              { n: "6", label: "AI Agents" },
              { n: "4", label: "Loop Stages" },
              { n: "4", label: "Neuro-Profiles" },
              { n: "∞", label: "Adaptive Cycles" },
            ].map(({ n, label }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  padding: "10px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{n}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 1 }}>
                  {label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 1: AGENTIC LOOP ── */}
      <div style={{ padding: "44px 56px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: BLUE }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>The 4-Stage Agentic Loop</h2>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0", marginLeft: 8 }} />
        </div>

        {/* loop cards row */}
        <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
          {loopStages.map((stage, i) => (
            <div key={stage.step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 16,
                  border: `2px solid ${stage.color}22`,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                {/* top bar */}
                <div
                  style={{
                    background: stage.color,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{stage.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 700, letterSpacing: 2 }}>
                      STAGE {stage.step}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{stage.label}</div>
                  </div>
                </div>

                {/* body */}
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55, marginBottom: 14 }}>{stage.desc}</p>
                  <div style={{ fontSize: 10, fontWeight: 700, color: stage.color, letterSpacing: 1, marginBottom: 8 }}>
                    ACTIVE AGENTS
                  </div>
                  {stage.agents.map((a) => (
                    <div
                      key={a}
                      style={{
                        background: stage.bg,
                        border: `1px solid ${stage.color}33`,
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: stage.color,
                        marginBottom: 5,
                      }}
                    >
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              {/* arrow between cards */}
              {i < loopStages.length - 1 && (
                <div
                  style={{
                    width: 28,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: 18, color: "#CBD5E0" }}>›</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* feedback loop arrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            margin: "20px 0 0",
            padding: "12px 24px",
            background: "linear-gradient(90deg, #EBF4FF, #F5F3FF, #ECFDF5, #FFFBEB)",
            borderRadius: 12,
            border: "1px solid #E2E8F0",
          }}
        >
          <span style={{ fontSize: 16 }}>🔁</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: SLATE }}>
            Continuous feedback loop — Reflect output feeds the next Plan stage automatically
          </span>
        </div>
      </div>

      {/* ── SECTION 2: AGENT COMMAND CENTER ── */}
      <div style={{ padding: "40px 56px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: "#7C3AED" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>Agent Command Center</h2>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0", marginLeft: 8 }} />
          <span
            style={{
              background: "#7C3AED",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 20,
              letterSpacing: 1,
            }}
          >
            LIVE ORCHESTRATION
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                background: "#fff",
                borderRadius: 14,
                border: `1.5px solid ${agent.color}22`,
                padding: "20px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* stage tag */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  fontSize: 9,
                  fontWeight: 700,
                  color: agent.color,
                  background: `${agent.color}15`,
                  padding: "2px 7px",
                  borderRadius: 10,
                  letterSpacing: 1,
                }}
              >
                {agent.stage}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: `${agent.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    border: `1.5px solid ${agent.color}30`,
                  }}
                >
                  {agent.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{agent.name}</div>
                  <div
                    style={{
                      width: 60,
                      height: 4,
                      borderRadius: 2,
                      background: `${agent.color}30`,
                      marginTop: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "70%",
                        height: "100%",
                        background: agent.color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{agent.role}</p>

              {/* status dot */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: agent.color,
                  }}
                />
                <span style={{ fontSize: 10, color: agent.color, fontWeight: 600 }}>System Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: NEURO-PROFILE MODES ── */}
      <div style={{ padding: "40px 56px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: "#059669" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>Dynamic Neuro-Profile Modes</h2>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0", marginLeft: 8 }} />
        </div>
        <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 28, paddingLeft: 16 }}>
          The NeuroAdapt Agent automatically reconfigures the entire interface based on the active profile.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
          {neuroProfiles.map((p) => (
            <div
              key={p.label}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: `2px solid ${p.border}22`,
                overflow: "hidden",
                boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
              }}
            >
              {/* header */}
              <div
                style={{
                  background: p.bg,
                  borderBottom: `2px solid ${p.border}22`,
                  padding: "16px 16px 12px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{p.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: p.color }}>{p.label}</div>
                <div
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    fontSize: 9,
                    fontWeight: 700,
                    color: p.badgeColor,
                    background: `${p.badgeColor}18`,
                    border: `1px solid ${p.badgeColor}30`,
                    padding: "2px 8px",
                    borderRadius: 10,
                    letterSpacing: 1,
                  }}
                >
                  {p.badge}
                </div>
              </div>

              {/* features */}
              <div style={{ padding: "14px 14px 16px" }}>
                {p.features.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                    <span style={{ fontSize: 11.5, color: SLATE, lineHeight: 1.5 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: HOW IT ALL CONNECTS ── */}
      <div style={{ padding: "40px 56px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: "#D97706" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>How The Loop Powers Each Mode</h2>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0", marginLeft: 8 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            {
              mode: "ADHD",
              icon: "⚡",
              color: "#7C3AED",
              bg: "#F5F3FF",
              how: [
                "Planning Agent sets 25-minute sprint boundaries per topic",
                "Content Agent limits bullets to 3 per concept chunk",
                "Observation Agent triggers attention check after 60s idle",
                "Reflection Agent awards XP and shows dopamine reward animation",
              ],
            },
            {
              mode: "Dyslexia",
              icon: "📝",
              color: "#B45309",
              bg: "#FFFBEB",
              how: [
                "Profiling Agent activates OpenDyslexic font via setAccessibility()",
                "NeuroAdapt enforces high-contrast dark theme automatically",
                "Content Agent increases line-height and letter-spacing in output",
                "Reflection Agent logs reading completion rates for pacing calibration",
              ],
            },
            {
              mode: "Autism",
              icon: "🔍",
              color: "#065F46",
              bg: "#ECFDF5",
              how: [
                "NeuroAdapt disables all animations and motion effects globally",
                "Planning Agent generates explicit numbered step-by-step roadmaps",
                "Content Agent uses consistent structural templates per response",
                "Observation Agent detects pattern-breaks and signals recalibration",
              ],
            },
            {
              mode: "Standard",
              icon: "⚖",
              color: "#3B5BDB",
              bg: "#EBF4FF",
              how: [
                "All 4 learning modalities available: Visual, Auditory, Kines., R/W",
                "Full content density with mixed media (text, images, links)",
                "Flexible pacing — no sprint limits or chunk restrictions",
                "Balanced XP rewards based on topic mastery progression",
              ],
            },
          ].map((item) => (
            <div
              key={item.mode}
              style={{
                background: "#fff",
                borderRadius: 14,
                border: `1.5px solid ${item.color}22`,
                overflow: "hidden",
                boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  background: item.bg,
                  padding: "12px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: `1.5px solid ${item.color}18`,
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>
                  {item.mode} Mode — Loop Integration
                </span>
              </div>
              <div style={{ padding: "14px 18px" }}>
                {item.how.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: item.color,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 12, color: SLATE, lineHeight: 1.55 }}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: "36px 56px 48px" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #1E3A8A 100%)`,
            borderRadius: 18,
            padding: "28px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
              KEY INSIGHT
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#fff", lineHeight: 1.6, maxWidth: 620 }}>
              Every question triggers a full agentic loop. The system never serves the same content twice — it
              continuously adapts modality, pacing, depth, and presentation to each learner's evolving cognitive state.
            </p>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>🎓</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>FlexiLearn</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Adaptive AI Platform</div>
          </div>
        </div>
      </div>
    </div>
  );
}
