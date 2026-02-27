import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { generateStoryProblem, textToSpeech, generateLesson } from "./ai";
import { insertParentSchema, insertChildSchema, insertSessionSchema, calculateCredits, type DifficultyLevel } from "@shared/schema";
import bcrypt from "bcrypt";

export function registerRoutes(app: Express): void {
  type RouteHandler = (req: Request, res: Response) => Promise<void>;

  const asyncHandler = (fn: RouteHandler) => (req: Request, res: Response) => {
    fn(req, res).catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
  };
  app.post("/api/auth/signup", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;
      
      const existing = await storage.getParentByEmail(email);
      if (existing) {
        res.status(400).json({ error: "Email already in use" });
        return;
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const parent = await storage.createParent({ email, password: hashedPassword, name });
      
      res.json({ id: parent.id, email: parent.email, name: parent.name });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      const parent = await storage.getParentByEmail(email);
      if (!parent) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      
      const valid = await bcrypt.compare(password, parent.password);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      
      res.json({ id: parent.id, email: parent.email, name: parent.name });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  const resetTokens = new Map<string, { email: string; code: string; expiresAt: number }>();

  app.post("/api/auth/request-reset", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      const parent = await storage.getParentByEmail(email);
      if (!parent) {
        res.status(404).json({ error: "No account found with that email" });
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const token = Math.random().toString(36).substring(2, 15);
      const expiresAt = Date.now() + 10 * 60 * 1000;

      resetTokens.set(token, { email, code, expiresAt });

      setTimeout(() => resetTokens.delete(token), 10 * 60 * 1000);

      res.json({ token, code });
    } catch (error) {
      console.error("Request reset error:", error);
      res.status(500).json({ error: "Failed to request password reset" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, code, newPassword } = req.body;

      if (!token || !code || !newPassword) {
        res.status(400).json({ error: "Token, code, and new password are required" });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters" });
        return;
      }

      const resetData = resetTokens.get(token);
      if (!resetData) {
        res.status(400).json({ error: "Invalid or expired reset request" });
        return;
      }

      if (Date.now() > resetData.expiresAt) {
        resetTokens.delete(token);
        res.status(400).json({ error: "Reset code has expired. Please try again." });
        return;
      }

      if (resetData.code !== code) {
        res.status(400).json({ error: "Incorrect verification code" });
        return;
      }

      const parent = await storage.getParentByEmail(resetData.email);
      if (!parent) {
        res.status(404).json({ error: "Account not found" });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateParentPassword(parent.id, hashedPassword);
      resetTokens.delete(token);

      res.json({ success: true });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/children/:parentId", async (req: Request, res: Response): Promise<void> => {
    try {
      const parentId = parseInt(req.params.parentId as string);
      const childrenList = await storage.getChildrenByParent(parentId);
      res.json(childrenList);
    } catch (error) {
      console.error("Get children error:", error);
      res.status(500).json({ error: "Failed to get children" });
    }
  });

  app.post("/api/children", async (req: Request, res: Response): Promise<void> => {
    try {
      const result = insertChildSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Invalid child data" });
        return;
      }
      const child = await storage.createChild(result.data);
      res.json(child);
    } catch (error) {
      console.error("Create child error:", error);
      res.status(500).json({ error: "Failed to create child" });
    }
  });

  app.patch("/api/children/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string);
      const child = await storage.updateChild(id, req.body);
      if (!child) {
        res.status(404).json({ error: "Child not found" });
        return;
      }
      res.json(child);
    } catch (error) {
      console.error("Update child error:", error);
      res.status(500).json({ error: "Failed to update child" });
    }
  });

  app.delete("/api/children/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteChild(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete child error:", error);
      res.status(500).json({ error: "Failed to delete child" });
    }
  });

  app.get("/api/sessions/:childId", async (req: Request, res: Response): Promise<void> => {
    try {
      const childId = parseInt(req.params.childId as string);
      const sessionsList = await storage.getSessionsByChild(childId);
      res.json(sessionsList);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.post("/api/sessions", async (req: Request, res: Response): Promise<void> => {
    try {
      const { topicId, difficulty, ...rest } = req.body;
      const result = insertSessionSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Invalid session data" });
        return;
      }

      let creditsEarned = 0;
      if (difficulty) {
        creditsEarned = calculateCredits(result.data.score, result.data.totalQuestions, difficulty as DifficultyLevel);
      }

      const sessionData = { ...result.data, creditsEarned };
      const session = await storage.createSession(sessionData);
      
      const today = new Date().toISOString().split("T")[0];
      const minutes = Math.ceil(result.data.timeSpentSeconds / 60);
      await storage.updateDailyUsage(result.data.childId, today, minutes);

      if (topicId && difficulty) {
        await storage.upsertTopicProgress(result.data.childId, topicId, difficulty, creditsEarned, result.data.score);
        await storage.addChildCredits(result.data.childId, creditsEarned);
      }
      
      res.json({ ...session, creditsEarned });
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/usage/:childId", async (req: Request, res: Response): Promise<void> => {
    try {
      const childId = parseInt(req.params.childId as string);
      const today = new Date().toISOString().split("T")[0];
      const usage = await storage.getDailyUsage(childId, today);
      res.json({ totalMinutes: usage?.totalMinutes || 0 });
    } catch (error) {
      console.error("Get usage error:", error);
      res.status(500).json({ error: "Failed to get usage" });
    }
  });

  app.post("/api/problem", async (req: Request, res: Response) => {
    try {
      const { operationType, grade } = req.body;
      const problem = await generateStoryProblem(operationType, grade);
      res.json(problem);
    } catch (error) {
      console.error("Generate problem error:", error);
      res.status(500).json({ error: "Failed to generate problem" });
    }
  });

  app.post("/api/tts", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      const audioBuffer = await textToSpeech(text);
      res.set("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  app.get("/api/topic-progress/:childId", async (req: Request, res: Response): Promise<void> => {
    try {
      const childId = parseInt(req.params.childId as string);
      const progress = await storage.getAllTopicProgress(childId);
      res.json(progress);
    } catch (error) {
      console.error("Get topic progress error:", error);
      res.status(500).json({ error: "Failed to get topic progress" });
    }
  });

  app.post("/api/teach", async (req: Request, res: Response) => {
    try {
      const { topicId, topicName, operationType, grade, difficulty } = req.body;
      const lesson = await generateLesson(topicName, operationType, grade, difficulty);
      res.json(lesson);
    } catch (error) {
      console.error("Generate lesson error:", error);
      res.status(500).json({ error: "Failed to generate lesson" });
    }
  });
}
