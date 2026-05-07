import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, learningPathsTable, lessonsTable } from "@workspace/db";
import {
  GetLearningPathParams,
  GetLearningPathResponse,
  GetLearningPathsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/learning-paths", async (_req, res): Promise<void> => {
  const paths = await db
    .select()
    .from(learningPathsTable)
    .orderBy(learningPathsTable.id);

  const pathsWithProgress = paths.map((p) => ({
    ...p,
    progressPercent:
      p.totalLessons > 0
        ? Math.round((p.completedLessons / p.totalLessons) * 100)
        : 0,
  }));

  res.json(GetLearningPathsResponse.parse(pathsWithProgress));
});

router.get("/learning-paths/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const params = GetLearningPathParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [path] = await db
    .select()
    .from(learningPathsTable)
    .where(eq(learningPathsTable.id, params.data.id));

  if (!path) {
    res.status(404).json({ message: "Learning path not found" });
    return;
  }

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.pathId, path.id))
    .orderBy(lessonsTable.order);

  const result = {
    ...path,
    progressPercent:
      path.totalLessons > 0
        ? Math.round((path.completedLessons / path.totalLessons) * 100)
        : 0,
    lessons,
  };

  res.json(GetLearningPathResponse.parse(result));
});

export default router;
