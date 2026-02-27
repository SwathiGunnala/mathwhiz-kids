import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { CURRICULUM, type DifficultyLevel } from "@shared/schema";

const TOTAL_QUESTIONS = 10;

interface Problem {
  story: string;
  question: string;
  problemType: string;
  answer: number;
  options: number[];
}

const LOADING_FACTS = [
  { emoji: "🧮", text: "The word 'mathematics' comes from the Greek word 'mathema' meaning 'learning'!" },
  { emoji: "🐙", text: "An octopus has 8 arms — that's 2 groups of 4!" },
  { emoji: "🌟", text: "A star shape has 5 points and 10 edges!" },
  { emoji: "🍕", text: "If you cut a pizza into 8 slices and eat 3, you have 5/8 left!" },
  { emoji: "🐝", text: "Honeybees make hexagons — shapes with 6 sides!" },
  { emoji: "🎲", text: "A dice has 6 faces, and opposite sides always add up to 7!" },
  { emoji: "🌈", text: "A rainbow has 7 colors. How many more to make 10?" },
  { emoji: "🦕", text: "Some dinosaurs were over 100 feet long — that's about 30 meters!" },
  { emoji: "🚀", text: "It takes about 3 days to travel from Earth to the Moon!" },
  { emoji: "🎵", text: "Music and math are best friends — rhythms use fractions!" },
  { emoji: "🏀", text: "A basketball court is a giant rectangle — about 94 feet long!" },
  { emoji: "🦋", text: "Butterflies have 2 wings on each side — that's 2 + 2 = 4 wings!" },
];

const PROBLEM_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  word_problem: { label: "Story Problem", icon: "📖" },
  real_world: { label: "Real World", icon: "🌍" },
  fill_blank: { label: "Fill in the Blank", icon: "✏️" },
  comparison: { label: "Compare", icon: "⚖️" },
  pattern: { label: "Pattern", icon: "🔢" },
  geometry_sides: { label: "Count Sides", icon: "📐" },
  geometry_corners: { label: "Count Corners", icon: "📐" },
  geometry_perimeter: { label: "Perimeter", icon: "📏" },
  geometry_area: { label: "Area", icon: "📐" },
  geometry_shape_identify: { label: "Mystery Shape", icon: "🔍" },
};

export default function Practice() {
  const [, navigate] = useLocation();
  const params = useParams<{ operation: string }>();
  const searchString = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const operation = params.operation || "addition";
  const topicId = searchParams.get("topic") || undefined;
  const difficulty = (searchParams.get("difficulty") as DifficultyLevel) || undefined;
  const topicInfo = topicId ? CURRICULUM.find(t => t.id === topicId) : undefined;

  const activeChild = useAuthStore((s) => s.activeChild);
  const voiceModeEnabled = useAuthStore((s) => s.voiceModeEnabled);
  const setPracticeResult = useAuthStore((s) => s.setPracticeResult);
  const setActivePractice = useAuthStore((s) => s.setActivePractice);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [history, setHistory] = useState<boolean[]>([]);
  const historyRef = useRef<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFact, setLoadingFact] = useState(() => LOADING_FACTS[Math.floor(Math.random() * LOADING_FACTS.length)]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!activeChild) return;
    const loadUsage = async () => {
      try {
        const usage = await api.usage.get(activeChild.id);
        const usedMinutes = usage?.totalMinutes || 0;
        const remaining = Math.max(0, (activeChild.dailyLimitMinutes - usedMinutes) * 60);
        setRemainingSeconds(remaining);
      } catch {
        setRemainingSeconds(activeChild.dailyLimitMinutes * 60);
      }
    };
    loadUsage();
  }, [activeChild]);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds === null]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchProblem = useCallback(async () => {
    if (!activeChild) return;
    setLoading(true);
    setLoadingFact(LOADING_FACTS[Math.floor(Math.random() * LOADING_FACTS.length)]);
    try {
      const newProblem = await api.problem.generate(operation, activeChild.grade);
      setProblem(newProblem);

      if (voiceModeEnabled && newProblem) {
        try {
          const audioBuffer = await api.tts.speak(newProblem.story + " " + newProblem.question);
          const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play().catch(() => {});
          }
        } catch (e) {
          console.error("TTS failed:", e);
        }
      }
    } catch (e) {
      console.error("Failed to fetch problem:", e);
    }
    setLoading(false);
  }, [activeChild, operation, voiceModeEnabled]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    if (activeChild) {
      setActivePractice({
        childId: activeChild.id,
        operation,
        questionIndex: 0,
        totalQuestions: TOTAL_QUESTIONS,
        score: 0,
        startedAt: new Date().toISOString(),
      });
    }
    fetchProblem();
    return () => {
      setActivePractice(null);
    };
  }, []);

  const sessionMutation = useMutation({
    mutationFn: (data: { score: number; timeSpentSeconds: number }) =>
      api.sessions.create({
        childId: activeChild!.id,
        operationType: operation,
        score: data.score,
        totalQuestions: TOTAL_QUESTIONS,
        timeSpentSeconds: data.timeSpentSeconds,
        topicId,
        difficulty,
      }),
  });

  const handleSelectAnswer = (answer: number) => {
    if (isSubmitted) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = useCallback(() => {
    if (selectedAnswer === null || !problem || isSubmitted) return;

    setIsSubmitted(true);
    const correct = selectedAnswer === problem.answer;
    setIsCorrect(correct);
    historyRef.current = [...historyRef.current, correct];
    setHistory([...historyRef.current]);

    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);

    setTimeout(async () => {
      if (questionIndex + 1 >= TOTAL_QUESTIONS || (remainingSeconds !== null && remainingSeconds <= 0)) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
        const finalHistory = historyRef.current;
        setActivePractice(null);
        const sessionResult = await sessionMutation.mutateAsync({ score: newScore, timeSpentSeconds: timeSpent });
        setPracticeResult({ score: newScore, total: TOTAL_QUESTIONS, operation, history: finalHistory, timeSpentSeconds: timeSpent, topicId, difficulty, creditsEarned: sessionResult?.creditsEarned });
        navigate("/results");
      } else {
        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        setSelectedAnswer(null);
        setIsSubmitted(false);
        setIsCorrect(null);
        const currentPractice = useAuthStore.getState().activePractice;
        if (activeChild) {
          setActivePractice({
            childId: activeChild.id,
            operation,
            questionIndex: nextIndex,
            totalQuestions: TOTAL_QUESTIONS,
            score: newScore,
            startedAt: currentPractice?.startedAt || new Date().toISOString(),
          });
        }
        fetchProblem();
      }
    }, 1500);
  }, [selectedAnswer, problem, isSubmitted, questionIndex, score, navigate, operation, fetchProblem, remainingSeconds]);

  const handleQuit = () => {
    if (window.confirm("Quit Practice? Your progress will not be saved.")) {
      setActivePractice(null);
      navigate("/");
    }
  };

  if (!activeChild) return null;

  if (remainingSeconds !== null && remainingSeconds <= 0) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-4 sm:px-6">
        <span className="text-6xl mb-4">⏰</span>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2 text-center">Time's Up!</h2>
        <p className="text-slate-500 text-center mb-6">
          Your daily learning time is over. Come back tomorrow!
        </p>
        <button onClick={() => navigate("/")} className="btn-primary w-full max-w-xs px-8 py-4">
          Go Home
        </button>
      </div>
    );
  }

  const progress = (questionIndex / TOTAL_QUESTIONS) * 100;
  const typeInfo = problem?.problemType ? PROBLEM_TYPE_LABELS[problem.problemType] : null;

  return (
    <div className="min-h-screen min-h-dvh flex flex-col pt-6 sm:pt-12 px-4 sm:px-6 pb-8 overflow-y-auto">
      <audio ref={audioRef} className="hidden" />

      <div className="w-full max-w-lg mx-auto flex flex-col flex-1">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <button
            onClick={handleQuit}
            className="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600 transition-all flex-shrink-0"
            data-testid="button-quit"
          >
            ✕
          </button>
          <div className="flex-1 min-w-0">
            <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-slate-500 text-xs mt-1 font-medium">
              Question {questionIndex + 1} of {TOTAL_QUESTIONS}
            </p>
          </div>
          <div className="bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow flex-shrink-0">
            <span className="font-bold text-amber-500 text-sm sm:text-base">⭐ {score}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex justify-center gap-1 sm:gap-1.5 flex-wrap">
            {history.map((result, i) => (
              <div
                key={i}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${result ? "bg-green-500" : "bg-red-400"}`}
              />
            ))}
          </div>
          {remainingSeconds !== null && (
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex-shrink-0 ${
              remainingSeconds < 120 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600"
            }`} data-testid="text-timer">
              <span>⏱</span>
              <span>{formatTime(remainingSeconds)}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="card p-6 sm:p-8 flex flex-col items-center justify-center">
            <div className="loading-bounce mb-4">
              <span className="text-5xl sm:text-6xl">{loadingFact.emoji}</span>
            </div>
            <p className="text-indigo-500 font-bold text-sm sm:text-base mb-3">Creating your question...</p>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="loading-dot w-2.5 h-2.5 rounded-full bg-indigo-400" style={{ animationDelay: "0ms" }} />
              <span className="loading-dot w-2.5 h-2.5 rounded-full bg-indigo-400" style={{ animationDelay: "150ms" }} />
              <span className="loading-dot w-2.5 h-2.5 rounded-full bg-indigo-400" style={{ animationDelay: "300ms" }} />
            </div>
            <div className="bg-amber-50 rounded-xl p-3 sm:p-4 w-full">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1 text-center">Did You Know?</p>
              <p className="text-sm text-amber-800 text-center leading-relaxed">{loadingFact.text}</p>
            </div>
          </div>
        ) : problem ? (
          <div className="card p-4 sm:p-7">
            {typeInfo && (
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <span className="text-lg">{typeInfo.icon}</span>
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">{typeInfo.label}</span>
              </div>
            )}
            <p className="text-base sm:text-xl text-slate-700 text-center leading-relaxed mb-3 sm:mb-4">{problem.story}</p>
            <div className="bg-amber-50 rounded-xl py-3 px-4 sm:px-5">
              <p className="text-slate-600 text-center font-semibold text-sm sm:text-base">{problem.question}</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mt-4 sm:mt-5">
          {problem?.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isTheAnswer = option === problem.answer;

            let classes = "rounded-2xl py-4 sm:py-6 text-center relative transition-all duration-150 min-h-[56px] ";

            if (isSubmitted) {
              if (isTheAnswer) {
                classes += "bg-green-500 text-white shadow-lg";
              } else if (isSelected) {
                classes += "bg-red-400 text-white opacity-80 shadow-lg";
              } else {
                classes += "bg-white opacity-30 shadow-sm";
              }
            } else if (isSelected) {
              classes += "bg-indigo-500 text-white shadow-lg ring-4 ring-indigo-200";
            } else {
              classes += "bg-white shadow-sm hover:shadow-md hover:bg-slate-50";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                disabled={isSubmitted}
                className={classes}
                data-testid={`button-option-${index}`}
              >
                <span className={`text-2xl sm:text-3xl font-extrabold ${isSubmitted ? "" : isSelected ? "text-white" : "text-slate-700"}`}>
                  {option}
                </span>
                {isSubmitted && isTheAnswer && (
                  <span className="absolute top-2 right-3 text-lg">✓</span>
                )}
                {isSubmitted && isSelected && !isTheAnswer && (
                  <span className="absolute top-2 right-3 text-lg">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {!isSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className={`mt-4 sm:mt-5 w-full py-4 rounded-2xl font-bold text-lg transition-all duration-150 ${
              selectedAnswer !== null
                ? "btn-primary"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            data-testid="button-submit-answer"
          >
            Submit Answer
          </button>
        )}

        {isCorrect !== null && (
          <div className="mt-4 sm:mt-5 text-center animate-bounce-in">
            <p className={`text-xl sm:text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-red-500"}`}>
              {isCorrect ? "Awesome! 🎉" : `The answer was ${problem?.answer}. Keep trying!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
