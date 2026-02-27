import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "../lib/store";
import { CURRICULUM } from "@shared/schema";

const OPERATION_LABELS: Record<string, { name: string; icon: string }> = {
  addition: { name: "Addition", icon: "+" },
  subtraction: { name: "Subtraction", icon: "-" },
  multiplication: { name: "Multiplication", icon: "x" },
  division: { name: "Division", icon: "÷" },
  geometry: { name: "Geometry", icon: "📐" },
};

const FUN_FACTS: Record<string, string[]> = {
  addition: [
    "Did you know? Adding numbers is one of the oldest math skills — people have been doing it for over 5,000 years!",
    "Fun fact: If you add all the numbers from 1 to 100, you get 5,050!",
    "Cool trick: Adding 9 to any number is the same as adding 10 and subtracting 1!",
    "Math magic: The sum of any two even numbers is always even!",
  ],
  subtraction: [
    "Fun fact: Subtraction is like addition in reverse — they're best friends!",
    "Did you know? The minus sign (-) was first used over 500 years ago!",
    "Cool trick: Subtracting 9 is the same as subtracting 10 and adding 1!",
    "Math magic: When you subtract a number from itself, you always get zero!",
  ],
  multiplication: [
    "Fun fact: Multiplication is really just a shortcut for adding the same number many times!",
    "Did you know? The multiplication sign (x) was invented in 1631!",
    "Cool trick: To multiply any number by 9, multiply by 10 then subtract the number!",
    "Math magic: Any number multiplied by 1 stays the same!",
  ],
  division: [
    "Fun fact: Division is the opposite of multiplication — like undo!",
    "Did you know? The division sign (÷) is called an obelus!",
    "Cool trick: Dividing by 2 is the same as finding half!",
    "Math magic: Any number divided by itself equals 1!",
  ],
  geometry: [
    "Fun fact: The word 'geometry' comes from Greek and means 'measuring the Earth'!",
    "Did you know? A circle has no corners and no straight sides!",
    "Cool trick: A square is a special rectangle where all sides are equal!",
    "Math magic: Triangles always have exactly 3 sides and their angles add up to 180 degrees!",
  ],
};

const ENCOURAGEMENT: Record<string, string[]> = {
  perfect: [
    "You're a math superstar! Every single answer was correct!",
    "Incredible! A perfect score — you're unstoppable!",
    "Wow! 100% correct! Your brain is on fire today!",
  ],
  great: [
    "You're doing amazing! Just a little more practice and you'll be perfect!",
    "So close to perfect! You really know your stuff!",
    "Fantastic work! Keep it up and you'll be a math champion!",
  ],
  good: [
    "Nice work! You're getting better every time you practice!",
    "Good job! Keep practicing and watch your score go up!",
    "You're on the right track! Every question you try makes you smarter!",
  ],
  tryAgain: [
    "Don't give up! Every math expert started right where you are!",
    "Practice makes progress! You'll do even better next time!",
    "Keep trying — you're learning something new with every question!",
  ],
};

function getStreak(history: boolean[]): { longest: number; current: number } {
  let longest = 0;
  let current = 0;
  for (const correct of history) {
    if (correct) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  let endStreak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]) endStreak++;
    else break;
  }
  return { longest, current: endStreak };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Results() {
  const [, navigate] = useLocation();
  const practiceResult = useAuthStore((s) => s.practiceResult);
  const setPracticeResult = useAuthStore((s) => s.setPracticeResult);
  const activeChild = useAuthStore((s) => s.activeChild);

  useEffect(() => {
    if (!practiceResult) {
      navigate("/");
    }
  }, [practiceResult, navigate]);

  const data = useMemo(() => {
    if (!practiceResult) return null;
    const { score, total, operation, history, timeSpentSeconds, topicId, difficulty, creditsEarned } = practiceResult;
    const topicInfo = topicId ? CURRICULUM.find(t => t.id === topicId) : undefined;
    const percentage = Math.round((score / total) * 100);
    const streak = getStreak(history);
    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;
    const timeDisplay = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const avgTime = Math.round(timeSpentSeconds / total);

    let tier: "perfect" | "great" | "good" | "tryAgain";
    let message: string;
    let emoji: string;
    let color: string;

    if (percentage === 100) {
      tier = "perfect";
      message = "Perfect Score!";
      emoji = "🌟";
      color = "#F59E0B";
    } else if (percentage >= 80) {
      tier = "great";
      message = "Awesome Job!";
      emoji = "🎉";
      color = "#22C55E";
    } else if (percentage >= 60) {
      tier = "good";
      message = "Nice Work!";
      emoji = "👍";
      color = "#14B8A6";
    } else {
      tier = "tryAgain";
      message = "Good Try!";
      emoji = "💪";
      color = "#6366F1";
    }

    const encouragement = pickRandom(ENCOURAGEMENT[tier]);
    const funFact = pickRandom(FUN_FACTS[operation] || FUN_FACTS.addition);
    const opInfo = OPERATION_LABELS[operation] || { name: operation, icon: "?" };

    return {
      score, total, operation, history, percentage, streak, timeDisplay,
      avgTime, message, emoji, color, encouragement, funFact, opInfo, tier,
      topicId, difficulty, creditsEarned, topicInfo,
    };
  }, [practiceResult]);

  if (!practiceResult || !data) return null;

  const handlePlayAgain = () => {
    setPracticeResult(null);
    if (data.topicId && data.difficulty) {
      navigate(`/practice/${data.operation}?topic=${data.topicId}&difficulty=${data.difficulty}`);
    } else {
      navigate(`/practice/${data.operation}`);
    }
  };

  const handleTryDifferent = () => {
    setPracticeResult(null);
    if (data.topicId) {
      navigate(`/topic/${data.topicId}`);
    } else {
      navigate("/");
    }
  };

  const handleGoHome = () => {
    setPracticeResult(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center px-4 sm:px-8 pt-8 sm:pt-14 pb-8 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center">
        <div className="text-center mb-4 animate-bounce-in">
          <span className="text-5xl sm:text-7xl block mb-3">{data.emoji}</span>
          <h1
            className="text-2xl sm:text-4xl font-extrabold text-center mb-1"
            style={{ color: data.color }}
            data-testid="text-message"
          >
            {data.message}
          </h1>
          {activeChild && (
            <p className="text-slate-400 text-sm font-medium">
              Great effort, {activeChild.name}!
            </p>
          )}
        </div>

        <div className="card p-4 sm:p-5 w-full mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{data.opInfo.icon}</span>
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide">{data.opInfo.name}</span>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold text-white"
              style={{ backgroundColor: data.color }}
              data-testid="text-percentage"
            >
              {data.percentage}%
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-center text-slate-800 mb-3" data-testid="text-score">
            {data.score} <span className="text-xl sm:text-2xl text-slate-400">/ {data.total}</span>
          </p>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${data.percentage}%`, backgroundColor: data.color }}
            />
          </div>
        </div>

        <div className="card p-4 w-full mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Question Review</p>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {data.history.map((correct, i) => (
              <div
                key={i}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                  correct
                    ? "bg-green-100 text-green-600 border-2 border-green-200"
                    : "bg-red-100 text-red-500 border-2 border-red-200"
                }`}
                data-testid={`review-question-${i}`}
              >
                {correct ? "✓" : "✗"}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> {data.score} correct
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> {data.total - data.score} missed
            </span>
          </div>
        </div>

        {data.creditsEarned !== undefined && data.creditsEarned > 0 && (
          <div className="card p-4 w-full mb-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🏆</span>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-amber-600" data-testid="text-credits-earned">+{data.creditsEarned} credits</p>
                <p className="text-xs text-amber-500 font-medium">
                  {data.difficulty === "advanced" ? "3x Advanced Bonus!" : data.difficulty === "difficult" ? "2x Difficulty Bonus!" : "Credits Earned"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mb-4">
          <div className="card p-2.5 sm:p-3 text-center">
            <span className="text-base sm:text-lg block mb-1">⏱</span>
            <p className="text-sm sm:text-lg font-extrabold text-slate-700" data-testid="text-time">{data.timeDisplay}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Total Time</p>
          </div>
          <div className="card p-2.5 sm:p-3 text-center">
            <span className="text-base sm:text-lg block mb-1">⚡</span>
            <p className="text-sm sm:text-lg font-extrabold text-slate-700" data-testid="text-avg-time">{data.avgTime}s</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Per Question</p>
          </div>
          <div className="card p-2.5 sm:p-3 text-center">
            <span className="text-base sm:text-lg block mb-1">🔥</span>
            <p className="text-sm sm:text-lg font-extrabold text-slate-700" data-testid="text-streak">{data.streak.longest}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Best Streak</p>
          </div>
        </div>

        <div className="card p-4 w-full mb-4 border-l-4" style={{ borderColor: data.color }}>
          <p className="text-sm text-slate-600 leading-relaxed" data-testid="text-encouragement">
            {data.encouragement}
          </p>
        </div>

        <div className="card p-4 w-full mb-6 bg-amber-50 border-2 border-amber-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Did You Know?</p>
              <p className="text-sm text-amber-800 leading-relaxed" data-testid="text-fun-fact">
                {data.funFact}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={handlePlayAgain}
            className="btn-primary w-full text-lg py-4"
            style={{ backgroundColor: data.color, boxShadow: `0 4px 14px ${data.color}40` }}
            data-testid="button-play-again"
          >
            {data.topicInfo ? `Practice ${data.topicInfo.name} Again` : `Play ${data.opInfo.name} Again`}
          </button>
          <button
            onClick={handleTryDifferent}
            className="btn-secondary w-full text-lg py-4"
            data-testid="button-try-different"
          >
            {data.topicId ? "Change Difficulty" : "Try a Different Topic"}
          </button>
          <button
            onClick={handleGoHome}
            className="w-full py-3 text-slate-400 font-semibold hover:text-slate-600 transition-colors text-center"
            data-testid="button-go-home"
          >
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
}
