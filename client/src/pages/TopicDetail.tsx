import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { CURRICULUM, PROFICIENCY_INFO, getProficiencyLevel, type DifficultyLevel, type ProficiencyLevel } from "@shared/schema";

const DIFFICULTIES: { level: DifficultyLevel; label: string; icon: string; color: string; description: string; multiplier: string }[] = [
  { level: "easy", label: "Easy", icon: "🌱", color: "#22C55E", description: "Start here to learn the basics", multiplier: "1x credits" },
  { level: "difficult", label: "Difficult", icon: "🔥", color: "#F59E0B", description: "Ready for a challenge?", multiplier: "2x credits" },
  { level: "advanced", label: "Advanced", icon: "🚀", color: "#8B5CF6", description: "For math superstars!", multiplier: "3x credits" },
];

interface Lesson {
  title: string;
  explanation: string;
  examples: { problem: string; solution: string; explanation: string }[];
  tip: string;
}

export default function TopicDetail() {
  const [, navigate] = useLocation();
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId || "";
  const activeChild = useAuthStore((s) => s.activeChild);

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("easy");
  const [showLesson, setShowLesson] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);

  const topic = CURRICULUM.find(t => t.id === topicId);

  const { data: progressData } = useQuery({
    queryKey: ["topicProgress", activeChild?.id],
    queryFn: () => activeChild ? api.topicProgress.getAll(activeChild.id) : [],
    enabled: !!activeChild,
  });

  if (!topic || !activeChild) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-4">
        <p className="text-slate-500">Topic not found</p>
        <button onClick={() => navigate("/")} className="btn-primary mt-4 px-6">Go Home</button>
      </div>
    );
  }

  const progress = progressData?.find(p => p.topicId === topicId);
  const proficiency = progress ? (progress.proficiencyLevel as ProficiencyLevel) : "beginner";
  const profInfo = PROFICIENCY_INFO[proficiency];
  const credits = progress?.totalCredits || 0;
  const bestScore = progress?.bestScore || 0;
  const sessionsCount = progress?.sessionsCompleted || 0;

  const handleLearnFirst = async () => {
    setLoadingLesson(true);
    setShowLesson(true);
    try {
      const result = await api.teach.generate({
        topicId: topic.id,
        topicName: topic.name,
        operationType: topic.operationType,
        grade: activeChild.grade,
        difficulty: selectedDifficulty,
      });
      setLesson(result);
    } catch (e) {
      console.error("Failed to generate lesson:", e);
      setLesson({
        title: `Let's Learn ${topic.name}!`,
        explanation: `${topic.name} is a fun part of math! Let's practice together.`,
        examples: [{ problem: "Ready to try?", solution: "Let's go!", explanation: "Practice makes perfect!" }],
        tip: "Take your time and think about each question carefully!",
      });
    }
    setLoadingLesson(false);
  };

  const handleStartExercise = () => {
    navigate(`/practice/${topic.operationType}?topic=${topic.id}&difficulty=${selectedDifficulty}`);
  };

  if (showLesson) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col px-4 sm:px-6 pt-6 sm:pt-10 pb-8 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto">
          <button
            onClick={() => setShowLesson(false)}
            className="text-indigo-500 font-semibold mb-4 text-left py-2 pr-4 hover:text-indigo-700 transition-colors"
            data-testid="button-back-from-lesson"
          >
            ← Back
          </button>

          {loadingLesson ? (
            <div className="card p-8 flex flex-col items-center justify-center">
              <div className="loading-bounce mb-4">
                <span className="text-5xl">{topic.icon}</span>
              </div>
              <p className="text-indigo-500 font-bold mb-3">Creating your lesson...</p>
              <div className="flex items-center gap-1.5">
                <span className="loading-dot w-2.5 h-2.5 rounded-full bg-indigo-400" style={{ animationDelay: "0ms" }} />
                <span className="loading-dot w-2.5 h-2.5 rounded-full bg-indigo-400" style={{ animationDelay: "150ms" }} />
                <span className="loading-dot w-2.5 h-2.5 rounded-full bg-indigo-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          ) : lesson ? (
            <>
              <div className="text-center mb-5">
                <span className="text-4xl block mb-2">{topic.icon}</span>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-1">{lesson.title}</h1>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: topic.color }}>
                  {DIFFICULTIES.find(d => d.level === selectedDifficulty)?.icon} {DIFFICULTIES.find(d => d.level === selectedDifficulty)?.label}
                </div>
              </div>

              <div className="card p-4 sm:p-5 mb-4">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">What You'll Learn</h3>
                <p className="text-slate-600 leading-relaxed">{lesson.explanation}</p>
              </div>

              <div className="card p-4 sm:p-5 mb-4">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-3">Examples</h3>
                <div className="space-y-4">
                  {lesson.examples.map((ex, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 sm:p-4">
                      <p className="font-bold text-slate-700 mb-1">{ex.problem}</p>
                      <p className="text-emerald-600 font-bold mb-1">Answer: {ex.solution}</p>
                      <p className="text-sm text-slate-500">{ex.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-4 mb-6 bg-amber-50 border-2 border-amber-100">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <div>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Pro Tip</p>
                    <p className="text-sm text-amber-800 leading-relaxed">{lesson.tip}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartExercise}
                className="btn-primary w-full text-lg py-4"
                style={{ backgroundColor: topic.color, boxShadow: `0 4px 14px ${topic.color}40` }}
                data-testid="button-start-exercises"
              >
                Start Exercises →
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col px-4 sm:px-6 pt-6 sm:pt-10 pb-8 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto">
        <button
          onClick={() => navigate("/")}
          className="text-indigo-500 font-semibold mb-4 text-left py-2 pr-4 hover:text-indigo-700 transition-colors"
          data-testid="button-back"
        >
          ← Back to Topics
        </button>

        <div className="text-center mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${topic.color}15` }}
          >
            <span className="text-4xl">{topic.icon}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">{topic.name}</h1>
          <p className="text-slate-500 text-sm">{topic.description}</p>
        </div>

        {sessionsCount > 0 && (
          <div className="card p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{profInfo.icon}</span>
                <span className="font-bold text-sm" style={{ color: profInfo.color }}>{profInfo.label}</span>
              </div>
              <span className="text-sm text-slate-400">{credits} / 100 credits</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, credits)}%`, backgroundColor: profInfo.color }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{sessionsCount} sessions</span>
              <span>Best: {bestScore}/{10}</span>
            </div>
          </div>
        )}

        <h3 className="text-sm font-bold text-slate-700 mb-3">Choose Difficulty</h3>
        <div className="space-y-2 mb-6">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.level}
              onClick={() => setSelectedDifficulty(d.level)}
              className={`w-full card p-4 text-left flex items-center gap-3 transition-all ${
                selectedDifficulty === d.level ? "ring-2 shadow-md" : ""
              }`}
              style={selectedDifficulty === d.level ? { borderColor: d.color, ringColor: d.color, boxShadow: `0 4px 14px ${d.color}20` } : {}}
              data-testid={`difficulty-${d.level}`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${d.color}15` }}
              >
                <span className="text-2xl">{d.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-700">{d.label}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${d.color}15`, color: d.color }}>
                    {d.multiplier}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{d.description}</p>
              </div>
              {selectedDifficulty === d.level && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: d.color }}>
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLearnFirst}
            className="btn-secondary w-full text-base py-4"
            data-testid="button-learn-first"
          >
            📖 Learn First
          </button>
          <button
            onClick={handleStartExercise}
            className="btn-primary w-full text-lg py-4"
            style={{ backgroundColor: topic.color, boxShadow: `0 4px 14px ${topic.color}40` }}
            data-testid="button-start-practice"
          >
            Start Practice →
          </button>
        </div>
      </div>
    </div>
  );
}
