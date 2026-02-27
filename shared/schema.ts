import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => parents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  dailyLimitMinutes: integer("daily_limit_minutes").notNull().default(20),
  avatarColor: text("avatar_color").notNull().default("#6366F1"),
  voiceModeEnabled: boolean("voice_mode_enabled").notNull().default(false),
  totalCredits: integer("total_credits").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  operationType: text("operation_type").notNull(),
  topicId: text("topic_id"),
  difficulty: text("difficulty"),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeSpentSeconds: integer("time_spent_seconds").notNull(),
  creditsEarned: integer("credits_earned").notNull().default(0),
  completedAt: timestamp("completed_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const dailyUsage = pgTable("daily_usage", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  totalMinutes: integer("total_minutes").notNull().default(0),
});

export const topicProgress = pgTable("topic_progress", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  topicId: text("topic_id").notNull(),
  difficulty: text("difficulty").notNull().default("easy"),
  totalCredits: integer("total_credits").notNull().default(0),
  sessionsCompleted: integer("sessions_completed").notNull().default(0),
  bestScore: integer("best_score").notNull().default(0),
  proficiencyLevel: text("proficiency_level").notNull().default("beginner"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  createdAt: true,
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  completedAt: true,
});

export const insertDailyUsageSchema = createInsertSchema(dailyUsage).omit({
  id: true,
});

export const insertTopicProgressSchema = createInsertSchema(topicProgress).omit({
  id: true,
  updatedAt: true,
});

export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type DailyUsage = typeof dailyUsage.$inferSelect;
export type InsertDailyUsage = z.infer<typeof insertDailyUsageSchema>;
export type TopicProgress = typeof topicProgress.$inferSelect;
export type InsertTopicProgress = z.infer<typeof insertTopicProgressSchema>;

export type GradeLevel = "K" | "1" | "2" | "3" | "4" | "5";
export type OperationType = "addition" | "subtraction" | "multiplication" | "division" | "geometry";
export type DifficultyLevel = "easy" | "difficult" | "advanced";
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "master";

export interface TopicDefinition {
  id: string;
  name: string;
  icon: string;
  operationType: OperationType;
  description: string;
  grades: GradeLevel[];
  color: string;
}

export const CURRICULUM: TopicDefinition[] = [
  { id: "counting", name: "Counting", icon: "🔢", operationType: "addition", description: "Count objects and numbers", grades: ["K"], color: "#6366F1" },
  { id: "number-bonds", name: "Number Bonds", icon: "🔗", operationType: "addition", description: "Numbers that go together", grades: ["K", "1"], color: "#8B5CF6" },
  { id: "addition-basics", name: "Addition Basics", icon: "➕", operationType: "addition", description: "Adding small numbers", grades: ["K", "1"], color: "#6366F1" },
  { id: "addition-facts", name: "Addition Facts", icon: "➕", operationType: "addition", description: "Addition facts to 20", grades: ["1", "2"], color: "#4F46E5" },
  { id: "two-digit-addition", name: "Two-Digit Addition", icon: "➕", operationType: "addition", description: "Adding bigger numbers", grades: ["2", "3"], color: "#4338CA" },
  { id: "subtraction-basics", name: "Subtraction Basics", icon: "➖", operationType: "subtraction", description: "Taking away numbers", grades: ["1", "2"], color: "#F59E0B" },
  { id: "subtraction-facts", name: "Subtraction Facts", icon: "➖", operationType: "subtraction", description: "Subtraction facts to 20", grades: ["2", "3"], color: "#D97706" },
  { id: "multiplication-basics", name: "Times Tables", icon: "✖️", operationType: "multiplication", description: "Learning times tables", grades: ["2", "3"], color: "#14B8A6" },
  { id: "multiplication-practice", name: "Multiplication Practice", icon: "✖️", operationType: "multiplication", description: "Multiply larger numbers", grades: ["3", "4"], color: "#0D9488" },
  { id: "division-basics", name: "Division Basics", icon: "➗", operationType: "division", description: "Sharing equally", grades: ["3", "4"], color: "#EC4899" },
  { id: "division-practice", name: "Division Practice", icon: "➗", operationType: "division", description: "Dividing larger numbers", grades: ["4", "5"], color: "#DB2777" },
  { id: "shapes", name: "Shapes", icon: "🔷", operationType: "geometry", description: "Identify and count shapes", grades: ["K", "1", "2"], color: "#8B5CF6" },
  { id: "perimeter", name: "Perimeter", icon: "📏", operationType: "geometry", description: "Measuring around shapes", grades: ["3", "4"], color: "#7C3AED" },
  { id: "area", name: "Area", icon: "📐", operationType: "geometry", description: "Measuring inside shapes", grades: ["4", "5"], color: "#6D28D9" },
  { id: "fractions-intro", name: "Fractions Intro", icon: "🍕", operationType: "division", description: "Parts of a whole", grades: ["3", "4", "5"], color: "#F43F5E" },
  { id: "multi-digit-multiply", name: "Multi-Digit Multiply", icon: "✖️", operationType: "multiplication", description: "Multiply big numbers", grades: ["4", "5"], color: "#059669" },
  { id: "long-division", name: "Long Division", icon: "➗", operationType: "division", description: "Divide step by step", grades: ["4", "5"], color: "#BE185D" },
  { id: "order-of-operations", name: "Order of Operations", icon: "📋", operationType: "addition", description: "PEMDAS rules", grades: ["5"], color: "#7C3AED" },
];

export function getTopicsForGrade(grade: GradeLevel): TopicDefinition[] {
  return CURRICULUM.filter(t => t.grades.includes(grade));
}

export function calculateCredits(score: number, totalQuestions: number, difficulty: DifficultyLevel): number {
  const accuracy = score / totalQuestions;
  const difficultyMultiplier = difficulty === "easy" ? 1 : difficulty === "difficult" ? 2 : 3;
  const baseCredits = Math.round(accuracy * 10);
  return baseCredits * difficultyMultiplier;
}

export function getProficiencyLevel(totalCredits: number): ProficiencyLevel {
  if (totalCredits >= 100) return "master";
  if (totalCredits >= 50) return "advanced";
  if (totalCredits >= 20) return "intermediate";
  return "beginner";
}

export const PROFICIENCY_INFO: Record<ProficiencyLevel, { label: string; icon: string; color: string; minCredits: number }> = {
  beginner: { label: "Beginner", icon: "🌱", color: "#22C55E", minCredits: 0 },
  intermediate: { label: "Intermediate", icon: "🌿", color: "#3B82F6", minCredits: 20 },
  advanced: { label: "Advanced", icon: "🌳", color: "#8B5CF6", minCredits: 50 },
  master: { label: "Master", icon: "👑", color: "#F59E0B", minCredits: 100 },
};
