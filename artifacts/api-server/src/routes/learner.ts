import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, learnerProfilesTable } from "@workspace/db";
import {
  CreateLearnerProfileBody,
  GetCurrentLearnerProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/learner-profiles/current", async (req, res): Promise<void> => {
  const [profile] = await db
    .select()
    .from(learnerProfilesTable)
    .orderBy(desc(learnerProfilesTable.createdAt))
    .limit(1);

  if (!profile) {
    res.status(404).json({ message: "No learner profile found" });
    return;
  }

  res.json(GetCurrentLearnerProfileResponse.parse(profile));
});

router.get("/learner-profiles/lookup", async (req, res): Promise<void> => {
  const name = (req.query.name as string | undefined)?.trim();
  if (!name) {
    res.status(400).json({ error: "name query param is required" });
    return;
  }

  const [profile] = await db
    .select()
    .from(learnerProfilesTable)
    .where(sql`lower(${learnerProfilesTable.displayName}) = lower(${name})`)
    .limit(1);

  if (!profile) {
    res.status(404).json({ message: "Profile not found" });
    return;
  }

  res.json(GetCurrentLearnerProfileResponse.parse(profile));
});

router.post("/learner-profiles", async (req, res): Promise<void> => {
  const parsed = CreateLearnerProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid request body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [profile] = await db
    .insert(learnerProfilesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(profile);
});

export default router;
