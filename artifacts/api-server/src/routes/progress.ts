import { Router, type IRouter } from "express";
import { db, lessonsTable, learningPathsTable, activityTable, skillsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { GetProgressSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/progress/summary", async (_req, res): Promise<void> => {
  const [{ completedCount }] = await db
    .select({ completedCount: sql<number>`count(*)::int` })
    .from(lessonsTable)
    .where(eq(lessonsTable.isCompleted, true));

  const [{ totalLessons }] = await db
    .select({ totalLessons: sql<number>`count(*)::int` })
    .from(lessonsTable);

  const [{ activePaths }] = await db
    .select({ activePaths: sql<number>`count(*)::int` })
    .from(learningPathsTable)
    .where(eq(learningPathsTable.isActive, true));

  const [{ improvedSkills }] = await db
    .select({ improvedSkills: sql<number>`count(*)::int` })
    .from(skillsTable);

  const recentActivity = await db
    .select()
    .from(activityTable)
    .orderBy(sql`${activityTable.timestamp} desc`)
    .limit(5);

  const overallProgressPercent =
    totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

  const summary = {
    totalLessonsCompleted: completedCount,
    totalActivePaths: activePaths,
    overallProgressPercent,
    currentStreak: 3,
    weeklyGoalPercent: 65,
    skillsImprovedThisWeek: Math.min(improvedSkills, 4),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      description: a.description,
      timestamp: a.timestamp,
      type: a.type as "lesson_complete" | "skill_leveled" | "path_started" | "streak_milestone",
    })),
  };

  res.json(GetProgressSummaryResponse.parse(summary));
});

export default router;
