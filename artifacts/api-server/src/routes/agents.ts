import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, agentStatusesTable } from "@workspace/db";
import {
  UpdateAgentStatusBody,
  UpdateAgentStatusParams,
  GetAgentsStatusResponse,
  UpdateAgentStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/agents/status", async (_req, res): Promise<void> => {
  const agents = await db
    .select()
    .from(agentStatusesTable)
    .orderBy(agentStatusesTable.id);

  const mapped = agents.map((a) => ({
    ...a,
    progressPercent: a.progressPercent ?? undefined,
    currentTask: a.currentTask ?? undefined,
  }));

  res.json(GetAgentsStatusResponse.parse(mapped));
});

router.patch("/agents/:id/status", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const params = UpdateAgentStatusParams.safeParse({ id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAgentStatusBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid request body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [agent] = await db
    .update(agentStatusesTable)
    .set({
      ...parsed.data,
      lastUpdated: new Date(),
    })
    .where(eq(agentStatusesTable.id, params.data.id))
    .returning();

  if (!agent) {
    res.status(404).json({ message: "Agent not found" });
    return;
  }

  res.json(UpdateAgentStatusResponse.parse(agent));
});

export default router;
