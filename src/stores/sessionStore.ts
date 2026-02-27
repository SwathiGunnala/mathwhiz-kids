import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { SessionProgress, DailyUsage, OperationType } from '../types';

interface SessionState {
  sessions: SessionProgress[];
  dailyUsage: DailyUsage[];
  currentSessionStart: number | null;
  
  startSession: () => void;
  endSession: (childId: string, operationType: OperationType, score: number, totalQuestions: number) => void;
  getTodayUsage: (childId: string) => number;
  getChildSessions: (childId: string) => SessionProgress[];
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  dailyUsage: [],
  currentSessionStart: null,

  startSession: () => {
    set({ currentSessionStart: Date.now() });
  },

  endSession: (childId, operationType, score, totalQuestions) => {
    const { currentSessionStart, sessions, dailyUsage } = get();
    if (!currentSessionStart) return;

    const timeSpentSeconds = Math.round((Date.now() - currentSessionStart) / 1000);
    const today = getTodayDate();

    const newSession: SessionProgress = {
      childId,
      date: today,
      operationType,
      score,
      totalQuestions,
      timeSpentSeconds,
      completedAt: new Date().toISOString(),
    };

    const existingUsage = dailyUsage.find(
      (u) => u.childId === childId && u.date === today
    );

    let updatedDailyUsage: DailyUsage[];
    if (existingUsage) {
      updatedDailyUsage = dailyUsage.map((u) =>
        u.childId === childId && u.date === today
          ? { ...u, totalMinutes: u.totalMinutes + Math.ceil(timeSpentSeconds / 60) }
          : u
      );
    } else {
      updatedDailyUsage = [
        ...dailyUsage,
        { childId, date: today, totalMinutes: Math.ceil(timeSpentSeconds / 60) },
      ];
    }

    set({
      sessions: [...sessions, newSession],
      dailyUsage: updatedDailyUsage,
      currentSessionStart: null,
    });

    get().saveToStorage();
  },

  getTodayUsage: (childId) => {
    const today = getTodayDate();
    const usage = get().dailyUsage.find(
      (u) => u.childId === childId && u.date === today
    );
    return usage?.totalMinutes || 0;
  },

  getChildSessions: (childId) => {
    return get().sessions.filter((s) => s.childId === childId);
  },

  loadFromStorage: async () => {
    try {
      const data = await SecureStore.getItemAsync('session_data');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          sessions: parsed.sessions || [],
          dailyUsage: parsed.dailyUsage || [],
        });
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { sessions, dailyUsage } = get();
      await SecureStore.setItemAsync(
        'session_data',
        JSON.stringify({ sessions, dailyUsage })
      );
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  },
}));
