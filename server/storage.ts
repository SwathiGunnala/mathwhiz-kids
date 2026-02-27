import { db } from "./db";
import { parents, children, sessions, dailyUsage, topicProgress } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Parent, InsertParent, Child, InsertChild, Session, InsertSession, DailyUsage, InsertDailyUsage, TopicProgress, InsertTopicProgress } from "@shared/schema";

export interface IStorage {
  getParentByEmail(email: string): Promise<Parent | undefined>;
  getParentById(id: number): Promise<Parent | undefined>;
  createParent(data: InsertParent): Promise<Parent>;
  updateParentPassword(id: number, hashedPassword: string): Promise<void>;

  getChildrenByParent(parentId: number): Promise<Child[]>;
  getChildById(id: number): Promise<Child | undefined>;
  createChild(data: InsertChild): Promise<Child>;
  updateChild(id: number, data: Partial<InsertChild>): Promise<Child | undefined>;
  deleteChild(id: number): Promise<void>;

  getSessionsByChild(childId: number): Promise<Session[]>;
  createSession(data: InsertSession): Promise<Session>;

  getDailyUsage(childId: number, date: string): Promise<DailyUsage | undefined>;
  updateDailyUsage(childId: number, date: string, minutes: number): Promise<void>;

  getTopicProgress(childId: number, topicId: string): Promise<TopicProgress | undefined>;
  getAllTopicProgress(childId: number): Promise<TopicProgress[]>;
  upsertTopicProgress(childId: number, topicId: string, difficulty: string, creditsEarned: number, score: number): Promise<TopicProgress>;
  addChildCredits(childId: number, credits: number): Promise<void>;
}

export const storage: IStorage = {
  async getParentByEmail(email: string) {
    const [parent] = await db.select().from(parents).where(eq(parents.email, email));
    return parent;
  },

  async getParentById(id: number) {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent;
  },

  async createParent(data: InsertParent) {
    const [parent] = await db.insert(parents).values(data).returning();
    return parent;
  },

  async updateParentPassword(id: number, hashedPassword: string) {
    await db.update(parents).set({ password: hashedPassword }).where(eq(parents.id, id));
  },

  async getChildrenByParent(parentId: number) {
    return db.select().from(children).where(eq(children.parentId, parentId));
  },

  async getChildById(id: number) {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  },

  async createChild(data: InsertChild) {
    const [child] = await db.insert(children).values(data).returning();
    return child;
  },

  async updateChild(id: number, data: Partial<InsertChild>) {
    const [child] = await db.update(children).set(data).where(eq(children.id, id)).returning();
    return child;
  },

  async deleteChild(id: number) {
    await db.delete(children).where(eq(children.id, id));
  },

  async getSessionsByChild(childId: number) {
    return db.select().from(sessions).where(eq(sessions.childId, childId)).orderBy(desc(sessions.completedAt));
  },

  async createSession(data: InsertSession) {
    const [session] = await db.insert(sessions).values(data).returning();
    return session;
  },

  async getDailyUsage(childId: number, date: string) {
    const [usage] = await db.select().from(dailyUsage).where(
      and(eq(dailyUsage.childId, childId), eq(dailyUsage.date, date))
    );
    return usage;
  },

  async updateDailyUsage(childId: number, date: string, minutes: number) {
    const existing = await this.getDailyUsage(childId, date);
    if (existing) {
      await db.update(dailyUsage).set({ totalMinutes: existing.totalMinutes + minutes }).where(eq(dailyUsage.id, existing.id));
    } else {
      await db.insert(dailyUsage).values({ childId, date, totalMinutes: minutes });
    }
  },

  async getTopicProgress(childId: number, topicId: string) {
    const [progress] = await db.select().from(topicProgress).where(
      and(eq(topicProgress.childId, childId), eq(topicProgress.topicId, topicId))
    );
    return progress;
  },

  async getAllTopicProgress(childId: number) {
    return db.select().from(topicProgress).where(eq(topicProgress.childId, childId));
  },

  async upsertTopicProgress(childId: number, topicId: string, difficulty: string, creditsEarned: number, score: number) {
    const existing = await this.getTopicProgress(childId, topicId);
    if (existing) {
      const newCredits = existing.totalCredits + creditsEarned;
      const { getProficiencyLevel } = await import("@shared/schema");
      const newLevel = getProficiencyLevel(newCredits);
      const [updated] = await db.update(topicProgress).set({
        totalCredits: newCredits,
        sessionsCompleted: existing.sessionsCompleted + 1,
        bestScore: Math.max(existing.bestScore, score),
        proficiencyLevel: newLevel,
        difficulty,
      }).where(eq(topicProgress.id, existing.id)).returning();
      return updated;
    } else {
      const { getProficiencyLevel } = await import("@shared/schema");
      const level = getProficiencyLevel(creditsEarned);
      const [created] = await db.insert(topicProgress).values({
        childId,
        topicId,
        difficulty,
        totalCredits: creditsEarned,
        sessionsCompleted: 1,
        bestScore: score,
        proficiencyLevel: level,
      }).returning();
      return created;
    }
  },

  async addChildCredits(childId: number, credits: number) {
    const child = await this.getChildById(childId);
    if (child) {
      await db.update(children).set({ totalCredits: child.totalCredits + credits }).where(eq(children.id, childId));
    }
  },
};
