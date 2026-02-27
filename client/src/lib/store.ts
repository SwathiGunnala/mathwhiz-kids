import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Child, Session, DifficultyLevel, TopicDefinition } from "@shared/schema";

interface Parent {
  id: number;
  email: string;
  name: string;
}

interface PracticeResult {
  score: number;
  total: number;
  operation: string;
  history: boolean[];
  timeSpentSeconds: number;
  topicId?: string;
  difficulty?: DifficultyLevel;
  creditsEarned?: number;
}

interface ActivePractice {
  childId: number;
  operation: string;
  questionIndex: number;
  totalQuestions: number;
  score: number;
  startedAt: string;
  topicId?: string;
  difficulty?: DifficultyLevel;
}

interface AuthStore {
  parent: Parent | null;
  activeChild: Child | null;
  children: Child[];
  practiceResult: PracticeResult | null;
  voiceModeEnabled: boolean;
  activePractice: ActivePractice | null;
  sidebarOpen: boolean;
  
  setParent: (parent: Parent | null) => void;
  setActiveChild: (child: Child | null) => void;
  setChildren: (children: Child[]) => void;
  addChild: (child: Child) => void;
  updateChildInStore: (id: number, data: Partial<Child>) => void;
  setPracticeResult: (result: PracticeResult | null) => void;
  setVoiceModeEnabled: (enabled: boolean) => void;
  setActivePractice: (practice: ActivePractice | null) => void;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      parent: null,
      activeChild: null,
      children: [],
      practiceResult: null,
      voiceModeEnabled: false,
      activePractice: null,
      sidebarOpen: false,

      setParent: (parent) => set({ parent }),
      setActiveChild: (activeChild) => set({ activeChild }),
      setChildren: (children) => set({ children }),
      addChild: (child) => set((state) => ({ 
        children: [...state.children, child],
        activeChild: state.activeChild || child
      })),
      updateChildInStore: (id, data) => set((state) => ({
        children: state.children.map(c => c.id === id ? { ...c, ...data } : c),
        activeChild: state.activeChild?.id === id ? { ...state.activeChild, ...data } : state.activeChild,
      })),
      setPracticeResult: (practiceResult) => set({ practiceResult }),
      setVoiceModeEnabled: (voiceModeEnabled) => set({ voiceModeEnabled }),
      setActivePractice: (activePractice) => set({ activePractice }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      logout: () => set({ parent: null, activeChild: null, children: [], practiceResult: null, activePractice: null, sidebarOpen: false }),
    }),
    { name: "mathwhiz-auth" }
  )
);
