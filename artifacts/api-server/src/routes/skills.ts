import { Router, type IRouter } from "express";
import { db, skillsTable } from "@workspace/db";
import { GetSkillsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/skills", async (_req, res): Promise<void> => {
  const skills = await db
    .select()
    .from(skillsTable)
    .orderBy(skillsTable.category, skillsTable.name);

  res.json(GetSkillsResponse.parse(skills));
});

export default router;
