import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, lessonsTable, learningPathsTable, activityTable } from "@workspace/db";
import {
  GetLessonParams,
  CompleteLessonParams,
  GetLessonResponse,
  CompleteLessonResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/lessons/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const params = GetLessonParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, params.data.id));

  if (!lesson) {
    res.status(404).json({ message: "Lesson not found" });
    return;
  }

  res.json(GetLessonResponse.parse(lesson));
});

router.post("/lessons/:id/complete", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const params = CompleteLessonParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db
    .update(lessonsTable)
    .set({ isCompleted: true })
    .where(eq(lessonsTable.id, params.data.id))
    .returning();

  if (!lesson) {
    res.status(404).json({ message: "Lesson not found" });
    return;
  }

  await db
    .update(learningPathsTable)
    .set({
      completedLessons: sql`${learningPathsTable.completedLessons} + 1`,
    })
    .where(eq(learningPathsTable.id, lesson.pathId));

  await db.insert(activityTable).values({
    description: `Completed lesson: ${lesson.title}`,
    type: "lesson_complete",
  });

  const completedAt = new Date();
  res.json(
    CompleteLessonResponse.parse({
      lessonId: lesson.id,
      isCompleted: true,
      completedAt,
    })
  );
});

export default router;
