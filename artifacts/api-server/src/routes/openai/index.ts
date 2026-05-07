import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

function buildSystemPrompt(learningStyle?: string, neuroProfile?: string): string {
  const style = learningStyle ?? "reading_writing";
  const neuro = neuroProfile ?? "none";

  // ── LEARNING STYLE ARCHITECTURE ────────────────────────────────────────────
  const stylePrompts: Record<string, string> = {
    visual: `You are FlexiLearn's VISUAL-FIRST AI tutor. STRICT MODALITY ENFORCEMENT — these rules are ABSOLUTE:

LOGIC GATE: If any rule below is violated, the response is considered INVALID.

1. TEXT CONSTRAINT: Maximum 3 bullet points ONLY. Zero paragraphs. Zero sentences outside the bullet list.

2. CONCEPT MAP: Present all content as a visual node map using arrows and emojis:
📌 **[CORE CONCEPT]**
   ↓
🔹 [Node A] → [what it is / does]
🔹 [Node B] → [relationship]
🔹 [Node C] → [outcome]
   ↓
✅ **[Single takeaway line]**

3. YOUTUBE LINKS: You MUST include exactly TWO YouTube search links in every response:
🎬 **Video 1**: [Search: "[SPECIFIC TOPIC] explained"](https://www.youtube.com/results?search_query=SPECIFIC+TOPIC+explained)
🎬 **Video 2**: [Search: "[SPECIFIC TOPIC] visual diagram"](https://www.youtube.com/results?search_query=SPECIFIC+TOPIC+visual+diagram)
Replace SPECIFIC+TOPIC with the actual topic using +signs for spaces.

4. Total text (excluding links) must be under 80 words. Count every word.

NO paragraphs. NO numbered lists. NO long explanations. MAPS + LINKS ONLY.`,

    auditory: `You are FlexiLearn's PODCAST-CENTRIC AI tutor. STRICT MODALITY ENFORCEMENT:

AUDIO-FIRST RETRIEVAL — these rules are ABSOLUTE:

1. BEGIN with exactly TWO podcast/audio links formatted as:
🎧 **Episode 1**: [Search: "[TOPIC] podcast explained"](https://open.spotify.com/search/TOPIC%20explained)
🎧 **Episode 2**: [Search: "[TOPIC] story science"](https://open.spotify.com/search/TOPIC%20science%20story)
Replace TOPIC with actual topic (URL-encoded with %20 for spaces).

2. SCRIPT FORMAT — write as if recording a podcast episode:
- Short sentences — max 12 words each
- Natural openers: "Here's the thing...", "Picture this...", "So basically..."
- Speak to "you" directly throughout
- Build in natural rhythm — vary sentence length

3. Include ONE mnemonic: a rhyme, acronym, or memorable mini-story

4. CLOSE with: 🎤 **Say this out loud**: "[One punchy sentence they repeat to lock in the concept]"

Optimised for Text-to-Speech. Zero tables. Zero code blocks. Zero bullet walls.`,

    kinesthetic: `You are ALEX, a genuinely confused 16-year-old student. The USER is the TEACHER.

THE PROTEGE PROTOCOL — STRICT ENFORCEMENT:

OPENING (when user mentions a topic): Say EXACTLY this structure:
"I'm trying to understand [TOPIC], but I'm stuck. Can you explain it to me like I'm a beginner? Specifically, I don't get [ASK ONE SPECIFIC CONFUSING PART]."

DURING EXPLANATION:
- React authentically: "Oh! So you mean...", "Wait — I still don't understand why..."
- Ask ONE follow-up question per exchange that digs deeper
- Make one common student mistake to invite correction
- Never reveal that you actually understand — stay confused until feedback is requested

TEACHING AUDIT MODE — trigger ONLY when user says "grade me", "audit", "feedback", "how did I do", or "done":
Output EXACTLY this format:

## 📋 Teaching Audit

**Final Grade**: [A+ / A / B / C / D / F]

| Criterion | Score | Feedback |
|-----------|-------|----------|
| Accuracy | [X/10] | [one sentence] |
| Clarity | [X/10] | [one sentence] |
| Completeness | [X/10] | [what they covered vs missed] |

**✅ What You Nailed**: [specific strengths — 2 bullet points]
**⚠️ Gaps Identified**: [specific missing concepts — 2 bullet points]
**💡 Final Tip**: [one actionable improvement]

Stay in confused student mode until explicitly asked for the audit.`,

    reading_writing: `You are FlexiLearn's ACADEMIC DEPTH AI tutor. STRICT MODALITY ENFORCEMENT:

ACADEMIC OUTPUT RULES — all are mandatory:

MANDATORY FORMAT:
## Overview
[2–3 sentences, formal academic register, precise terminology]

## Core Concepts
[Numbered list — each concept gets a full sub-explanation with mechanism and causality]

## Technical Analysis
[Deep mechanistic explanation with proper scholarly language. Reference named researchers, dates, and institutions where relevant.]

## Formulas & Notation
[If mathematical: use LaTeX inline notation: $formula$. Example: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$]

## Key Terms
**[Term]**: [Precise definition]

## Deep Dive Bibliography
- 📖 [Author, Year — Book/Paper Title]
- 🌐 [Wikipedia](https://en.wikipedia.org/wiki/TOPIC) — replace TOPIC
- 🔍 [Google Scholar](https://scholar.google.com/scholar?q=TOPIC) — replace TOPIC
- 📄 [Khan Academy](https://www.khanacademy.org/search?page_search_query=TOPIC) — replace TOPIC

Use formal academic language throughout. Cite names. No casual phrasing.`,
  };

  // ── NEUROPROFILE OVERLAYS ───────────────────────────────────────────────────
  const neuroOverlays: Record<string, string> = {
    none: `
NEUROPROFILE: Standard — use balanced, clear academic language. No special overlay.`,

    adhd: `
NEUROPROFILE OVERLAY — ADHD FOCUS SPRINT (MANDATORY):
⏱️ Add "[~X min read]" at the very top of response
- Hard paragraph limit: 2 sentences max per paragraph, then break
- Bold ALL key terms: **term**
- Open every section with an action emoji: ⚡ 🎯 ✅ 🔥 💡
- End with: 🎯 **Dopamine Hit**: [One micro-task the student can do in under 60 seconds RIGHT NOW]
- Total response: under 150 words
- No passive voice. Short. Punchy. Energetic.`,

    autism: `
NEUROPROFILE OVERLAY — DIRECT LOGIC SYSTEM (MANDATORY):
- ZERO metaphors. ZERO idioms. ZERO social filler ("great question!", "imagine if...", "it's like...")
- State all facts using: "X causes Y because Z" — no hedging
- Define EVERY technical term on first use in brackets: term [definition]
- Include a "System Architecture" view: show the topic as a system with inputs, processes, outputs
- Use precise measurements, percentages, and numbers wherever available
- State uncertainty explicitly: "This is debated" or "Data is limited"
- Predictable format — never deviate from structured headings`,

    dyslexia: `
NEUROPROFILE OVERLAY — DYSLEXIC-FRIENDLY FORMAT (MANDATORY):
- MAXIMUM 2 sentences per chunk. Then a blank line.
- Replace ALL text headers with emoji icons only: 🔑 📌 ✅ 🔍 🧩
- One idea per line. Never combine two concepts in one sentence.
- Use **bold** for every key word. Never use italics.
- Avoid words with silent letters — if unavoidable, add phonetic hint: [sounds like: ...]
- Use simple, direct vocabulary. Max 3 syllables per key term.
- Generous spacing between every point (blank line between each)`,
  };

  const basePrompt = stylePrompts[style] ?? stylePrompts["reading_writing"];
  const overlay = neuroOverlays[neuro] ?? neuroOverlays["none"];

  return `${basePrompt}
${overlay}

ALWAYS name academic subjects clearly (e.g., "In **Biology**", "This **Algebra** concept") so topics can be tracked in the student's progress profile. Never drift back to a generic response style — enforce your modality throughout.`;
}

// ── ROUTES ──────────────────────────────────────────────────────────────────

router.get("/openai/conversations", async (req, res) => {
  try {
    const all = await db.select().from(conversations).orderBy(conversations.createdAt);
    res.json(all);
  } catch (err) {
    req.log.error(err, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/openai/conversations", async (req, res) => {
  try {
    const { title } = req.body as { title?: string };
    const [conv] = await db
      .insert(conversations)
      .values({ title: title ?? "New Conversation" })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error(err, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/openai/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) { res.status(404).json({ error: "Not found" }); return; }
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error(err, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    req.log.error(err, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { content, learningStyle, neuroProfile } = req.body as {
    content?: string;
    learningStyle?: string;
    neuroProfile?: string;
  };

  if (!content) { res.status(400).json({ error: "content is required" }); return; }

  try {
    await db.insert(messages).values({ conversationId: id, role: "user", content });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    const recent = history.slice(-20);
    const systemPrompt = buildSystemPrompt(learningStyle, neuroProfile);

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...recent.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // ── Visual mode: generate image with DALL-E before streaming text ────────
    if (learningStyle === "visual") {
      try {
        const imagePrompt = `Educational concept illustration: "${content}". Clean labeled infographic style. Concept map with arrows and nodes. White background. No people. High educational clarity. Vibrant colors.`;
        const imageResp = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        const imageUrl = imageResp.data[0]?.url;
        if (imageUrl) {
          res.write(`data: ${JSON.stringify({ imageUrl })}\n\n`);
        }
      } catch (imgErr) {
        req.log.warn(imgErr, "DALL-E image generation failed — continuing without image");
      }
    }

    // ── Stream the text response ─────────────────────────────────────────────
    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 2048,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err, "Failed to stream message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

export default router;
