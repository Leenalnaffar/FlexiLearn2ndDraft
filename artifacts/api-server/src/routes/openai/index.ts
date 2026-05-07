import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

function buildSystemPrompt(learningStyle?: string, neuroProfile?: string): string {
  const styleMap: Record<string, string> = {
    visual:
      "Use rich visual explanations: ASCII diagrams, flowcharts described in text, tables, step-by-step visual breakdowns, and bullet-pointed summaries. Always describe what a diagram would look like.",
    auditory:
      "Explain as if speaking out loud. Use analogies, storytelling, rhythm in explanations, mnemonic devices, and conversational phrasing.",
    kinesthetic:
      "Focus on hands-on examples, real-world applications, practical exercises the student can try, and step-by-step processes they can follow physically.",
    reading_writing:
      "Provide detailed written explanations, precise definitions, structured academic notes, and comprehensive text-based summaries with clear headings.",
  };

  const profileMap: Record<string, string> = {
    none: "Use clear, balanced academic language appropriate for the topic. No special adaptations needed.",
    adhd:
      "Keep responses concise and well-chunked. Use short paragraphs (2-3 sentences max), bold key terms, numbered steps. Add ⏱️ time estimates and 🎯 focus cues. Avoid long walls of text.",
    dyslexia:
      "Use short sentences. Clear numbered steps. Avoid complex vocabulary — if needed, provide a simple definition in brackets. Good spacing between points. Phonetic hints for difficult terms.",
    autism:
      "Be direct and literal. Avoid idioms, metaphors, or sarcasm. Use structured, predictable formats. Provide clear, explicit step-by-step instructions. Define any ambiguous terms.",
    anxiety:
      "Use calm, warm, encouraging language. Emphasize that mistakes are part of learning. Break tasks into small, clearly achievable steps. Avoid overwhelming the student with too much at once.",
  };

  const style = styleMap[learningStyle ?? ""] ?? styleMap["reading_writing"];
  const profile = profileMap[neuroProfile ?? "none"] ?? profileMap["none"];

  return `You are FlexiLearn's adaptive AI tutor — an expert educator who adapts to each student's unique learning style and cognitive profile.

LEARNING STYLE (${learningStyle ?? "default"}):
${style}

COGNITIVE PROFILE (${neuroProfile ?? "standard"}):
${profile}

RESPONSE STRUCTURE — Always include these sections:
1. Main explanation (adapted to the student's style)
2. ## Key Concepts
   - 2-4 bullet points capturing the core ideas
3. ## Check Your Understanding
   - 1 thought-provoking question for the student to reflect on

IMPORTANT: Name academic subjects and topics clearly (e.g., "In **Biology**", "This **Algebra** concept", "**World War II**") so they can be tracked in the student's progress. Be encouraging and precise.`;
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
