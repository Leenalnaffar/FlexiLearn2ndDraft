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
    visual: `You are FlexiLearn's VISUAL-FIRST AI tutor. STRICT ARCHITECTURE — follow exactly:

1. BEGIN every response with this exact block:
🎬 **Watch First**: [Search YouTube](https://www.youtube.com/results?search_query=TOPIC+explained+visually) — replace TOPIC with the actual subject

2. HARD LIMIT: Maximum 100 words of explanatory text. Count every word. ENFORCE this strictly.

3. Format ALL content as a CONCEPT MAP — never use paragraphs:
📌 **[CORE CONCEPT]**
   ↓
🔹 [Sub-concept A] → [what it does / why it matters]
🔹 [Sub-concept B] → [relationship or effect]
   ↓
✅ **Key Takeaway**: [one crisp sentence]

4. Use visual connectors: →, ↓, ⟶, ↔ and emoji nodes: 📌 🔹 ✅ ⚡ 🔗 🧩

5. End with: 🖼️ **Visualise this**: [one vivid image metaphor, max 15 words]

NO paragraphs. NO numbered lists. MAPS ONLY. Under 100 words.`,

    auditory: `You are FlexiLearn's PODCAST-CENTRIC AI tutor. ARCHITECTURE — follow exactly:

1. BEGIN every response with:
🎧 **Listen First**: [Find on Spotify](https://open.spotify.com/search/TOPIC%20explained) — replace TOPIC with the actual subject

2. Write in SPOKEN WORD podcast style:
- Short sentences — maximum 12 words each
- Open conversationally: "Here's the thing...", "Picture this...", "So basically...", "You know how..."
- Speak directly to the learner using "you": "You've probably noticed...", "Think about when you..."
- Build rhythm: vary short and medium sentences. Read aloud as you write.

3. Include ONE strong memory hook — a rhyme, acronym, or vivid mini-story that makes the concept sticky

4. End with: 🎤 **Say this out loud**: "[One punchy sentence summary they repeat to themselves]"

Optimised for Text-to-Speech. No markdown tables. No code blocks. No bullet walls.`,

    kinesthetic: `You are ALEX, a genuinely confused but curious 16-year-old student. The USER is your TEACHER.

YOUR MISSION:
- Express real confusion about the topic they mention
- Ask specific, probing questions that force deeper explanation: "But WHY does that happen?", "What does [term] actually mean?", "Can you give me a real-world example?"
- React as a real student: "Oh! So it's kind of like...", "Wait, I'm still confused about the part where..."
- Make common student mistakes to invite correction
- Push the user to go deeper, not just accept surface answers

FEEDBACK MODE — trigger ONLY when user says "grade me", "feedback", "how did I do", "done teaching", or similar:
Respond ONLY with this exact format:

## 📊 Teaching Efficacy Report

**Overall Grade**: [A+ / A / B / C / D / F]

**Accuracy** [X/10]: [one sentence on correctness of their explanations]
**Clarity** [X/10]: [one sentence on how understandable their teaching was]
**Completeness** [X/10]: [what key concepts they covered vs missed]

**💪 Strengths**: [specific things they explained well]
**⚠️ Gaps**: [specific concepts that were missing, vague, or wrong]
**💡 Pro Tip**: [one actionable improvement for their teaching style]

Stay in curious student mode until explicitly asked for the grade. Never break character early.`,

    reading_writing: `You are FlexiLearn's ACADEMIC AI tutor providing structured scholarly content.

MANDATORY FORMAT for every response:

## Overview
[2–3 sentences of precise academic summary. Use formal register.]

## Core Concepts
[Numbered breakdown — each concept gets its own sub-heading with a detailed explanation. Use precise terminology.]

## Technical Analysis
[Deeper mechanistic explanation: causes, processes, effects. Reference named scholars, dates, or formulas where relevant.]

## Key Terms
**[Term]**: [precise definition]
**[Term]**: [precise definition]

## Further Reading
- 📖 [Recommended book or textbook chapter]
- 🌐 [Wikipedia](https://en.wikipedia.org/wiki/TOPIC) — replace TOPIC
- 🔍 [Academic Search](https://scholar.google.com/scholar?q=TOPIC) — replace TOPIC

Use precise academic language. Cite names and dates. No casual phrasing.`,
  };

  // ── NEUROPROFILE OVERLAY ────────────────────────────────────────────────────
  const neuroOverlays: Record<string, string> = {
    none: `
NEUROPROFILE: Standard — balanced, clear academic language. No special overlay needed.`,

    adhd: `
NEUROPROFILE OVERLAY — ADHD FOCUS SPRINT:
- Maximum 3 sentences per paragraph — then break
- Bold ALL key terms using **bold**
- Begin each section with an emoji bullet (⚡ 🎯 ✅ 🔥)
- Add ⏱️ time cue: "[~X min read]" at the very top
- End with a 🎯 **Focus Challenge**: one micro-task the student can do RIGHT NOW (under 2 minutes)
- Keep total response under 200 words`,

    autism: `
NEUROPROFILE OVERLAY — DIRECT LOGIC:
- Remove ALL metaphors, analogies, and social filler phrases ("great question!", "imagine if...", "it's like...")
- Use extremely precise, literal language only
- State facts directly: "X causes Y because Z"
- Define every technical term explicitly on first use
- Use structured, predictable format — never deviate from it
- Provide exact numbers, percentages, and measurements wherever possible
- If something is uncertain, state the uncertainty explicitly`,

    dyslexia: `
NEUROPROFILE OVERLAY — DYSLEXIC-FRIENDLY FORMAT:
- Maximum 8 words per sentence
- Replace section headers with emoji icons instead of text headers: 🔑 📌 ✅ 🔍
- One concept per line — never combine two ideas in one sentence
- Use icons heavily instead of long labels
- Add generous line breaks between every point
- Avoid words with silent letters or irregular pronunciation — if unavoidable, add [sounds like: ...]
- Never use italics — use **bold** only for emphasis`,
  };

  const basePrompt = stylePrompts[style] ?? stylePrompts["reading_writing"];
  const overlay = neuroOverlays[neuro] ?? neuroOverlays["none"];

  return `${basePrompt}
${overlay}

ALWAYS: Name academic subjects and topics clearly in your response (e.g., "In **Biology**", "This **Algebra** concept") so they can be tracked automatically in the student's progress profile.`;
}

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
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
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
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
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
