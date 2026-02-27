export type GradeLevel = 'K' | '1' | '2' | '3' | '4' | '5';

export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface ChildProfile {
  id: string;
  name: string;
  grade: GradeLevel;
  dailyLimitMinutes: number;
  avatarColor: string;
}

export interface Parent {
  id: string;
  email: string;
  name: string;
  children: ChildProfile[];
}

export interface MathProblem {
  id: string;
  story: string;
  question: string;
  num1: number;
  num2: number;
  operator: string;
  answer: number;
  options: number[];
}

export interface SessionProgress {
  childId: string;
  date: string;
  operationType: OperationType;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface DailyUsage {
  childId: string;
  date: string;
  totalMinutes: number;
}
