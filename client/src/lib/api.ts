import type { Child, Session, TopicProgress } from "@shared/schema";

const API_BASE = "";

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

export const api = {
  auth: {
    signup: (data: { email: string; password: string; name: string }) =>
      fetchAPI<{ id: number; email: string; name: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      fetchAPI<{ id: number; email: string; name: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    requestReset: (data: { email: string }) =>
      fetchAPI<{ token: string; code: string }>("/api/auth/request-reset", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    resetPassword: (data: { token: string; code: string; newPassword: string }) =>
      fetchAPI<{ success: boolean }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  children: {
    list: (parentId: number) => fetchAPI<Child[]>(`/api/children/${parentId}`),
    create: (data: { parentId: number; name: string; grade: string; dailyLimitMinutes: number; avatarColor: string }) =>
      fetchAPI<Child>("/api/children", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Child>) =>
      fetchAPI<Child>(`/api/children/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<{ success: boolean }>(`/api/children/${id}`, { method: "DELETE" }),
  },

  sessions: {
    list: (childId: number) => fetchAPI<Session[]>(`/api/sessions/${childId}`),
    create: (data: { childId: number; operationType: string; score: number; totalQuestions: number; timeSpentSeconds: number; topicId?: string; difficulty?: string }) =>
      fetchAPI<Session & { creditsEarned: number }>("/api/sessions", { method: "POST", body: JSON.stringify(data) }),
  },

  usage: {
    get: (childId: number) => fetchAPI<{ totalMinutes: number }>(`/api/usage/${childId}`),
  },

  problem: {
    generate: (operationType: string, grade: string) =>
      fetchAPI<{
        story: string;
        question: string;
        problemType: string;
        answer: number;
        options: number[];
      }>("/api/problem", { method: "POST", body: JSON.stringify({ operationType, grade }) }),
  },

  topicProgress: {
    getAll: (childId: number) => fetchAPI<TopicProgress[]>(`/api/topic-progress/${childId}`),
  },

  teach: {
    generate: (data: { topicId: string; topicName: string; operationType: string; grade: string; difficulty: string }) =>
      fetchAPI<{
        title: string;
        explanation: string;
        examples: { problem: string; solution: string; explanation: string }[];
        tip: string;
      }>("/api/teach", { method: "POST", body: JSON.stringify(data) }),
  },

  tts: {
    speak: async (text: string): Promise<ArrayBuffer> => {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      return res.arrayBuffer();
    },
  },
};
