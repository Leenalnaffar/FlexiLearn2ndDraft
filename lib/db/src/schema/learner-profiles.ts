import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const learnerProfilesTable = pgTable("learner_profiles", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),
  learningStyle: text("learning_style").notNull(),
  neurodivergentProfile: text("neurodivergent_profile").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLearnerProfileSchema = createInsertSchema(learnerProfilesTable).omit({ id: true, createdAt: true });
export type InsertLearnerProfile = z.infer<typeof insertLearnerProfileSchema>;
export type LearnerProfile = typeof learnerProfilesTable.$inferSelect;
