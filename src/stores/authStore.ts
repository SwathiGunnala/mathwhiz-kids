import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Parent, ChildProfile } from '../types';

interface AuthState {
  parent: Parent | null;
  activeChild: ChildProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  setParent: (parent: Parent | null) => void;
  setActiveChild: (child: ChildProfile | null) => void;
  addChild: (child: ChildProfile) => void;
  updateChild: (childId: string, updates: Partial<ChildProfile>) => void;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  parent: null,
  activeChild: null,
  isLoading: true,
  isAuthenticated: false,

  setParent: (parent) => {
    set({ parent, isAuthenticated: !!parent });
    get().saveToStorage();
  },

  setActiveChild: (child) => {
    set({ activeChild: child });
    get().saveToStorage();
  },

  addChild: (child) => {
    const parent = get().parent;
    if (parent) {
      const updatedParent = {
        ...parent,
        children: [...parent.children, child],
      };
      set({ parent: updatedParent });
      get().saveToStorage();
    }
  },

  updateChild: (childId, updates) => {
    const parent = get().parent;
    if (parent) {
      const updatedChildren = parent.children.map((c) =>
        c.id === childId ? { ...c, ...updates } : c
      );
      const updatedParent = { ...parent, children: updatedChildren };
      set({ parent: updatedParent });
      
      const activeChild = get().activeChild;
      if (activeChild?.id === childId) {
        set({ activeChild: { ...activeChild, ...updates } });
      }
      get().saveToStorage();
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_data');
    set({ parent: null, activeChild: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const data = await SecureStore.getItemAsync('auth_data');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          parent: parsed.parent,
          activeChild: parsed.activeChild,
          isAuthenticated: !!parsed.parent,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
      set({ isLoading: false });
    }
  },

  saveToStorage: async () => {
    try {
      const { parent, activeChild } = get();
      await SecureStore.setItemAsync(
        'auth_data',
        JSON.stringify({ parent, activeChild })
      );
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  },
}));
