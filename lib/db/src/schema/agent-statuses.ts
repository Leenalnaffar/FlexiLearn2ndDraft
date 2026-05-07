import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentStatusesTable = pgTable("agent_statuses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("idle"),
  progressPercent: real("progress_percent"),
  currentTask: text("current_task"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAgentStatusSchema = createInsertSchema(agentStatusesTable).omit({ lastUpdated: true });
export type InsertAgentStatus = z.infer<typeof insertAgentStatusSchema>;
export type AgentStatus = typeof agentStatusesTable.$inferSelect;
