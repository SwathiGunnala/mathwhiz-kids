import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";

const OPERATIONS = [
  { type: "addition", icon: "➕", color: "#6366F1", title: "Addition", desc: "Put numbers together" },
  { type: "subtraction", icon: "➖", color: "#F59E0B", title: "Subtraction", desc: "Take numbers away" },
  { type: "multiplication", icon: "✖️", color: "#14B8A6", title: "Multiplication", desc: "Groups of numbers" },
  { type: "division", icon: "➗", color: "#EC4899", title: "Division", desc: "Share equally" },
  { type: "geometry", icon: "📐", color: "#8B5CF6", title: "Geometry", desc: "Shapes & measuring" },
];

function getAvailableOperations(grade: string) {
  switch (grade) {
    case "K": return ["addition"];
    case "1": return ["addition", "subtraction"];
    case "2": return ["addition", "subtraction", "geometry"];
    case "3": return ["addition", "subtraction", "multiplication", "geometry"];
    case "4": return ["addition", "subtraction", "multiplication", "division", "geometry"];
    default: return ["addition", "subtraction", "multiplication", "division", "geometry"];
  }
}

export default function Home() {
  const [, navigate] = useLocation();
  const activeChild = useAuthStore((s) => s.activeChild);
  const voiceModeEnabled = useAuthStore((s) => s.voiceModeEnabled);
  const setVoiceModeEnabled = useAuthStore((s) => s.setVoiceModeEnabled);

  const { data: usageData } = useQuery({
    queryKey: ["usage", activeChild?.id],
    queryFn: () => activeChild ? api.usage.get(activeChild.id) : null,
    enabled: !!activeChild,
    refetchInterval: 30000,
  });

  if (!activeChild) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-4 sm:px-8">
        <span className="text-7xl mb-6">👋</span>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-3 text-center">Welcome!</h1>
        <p className="text-slate-500 text-center mb-8">Let's add your child to get started</p>
        <button
          onClick={() => navigate("/add-child")}
          className="btn-primary w-full max-w-xs text-lg px-8 py-4"
          data-testid="button-add-child"
        >
          Add Child
        </button>
      </div>
    );
  }

  const availableOps = getAvailableOperations(activeChild.grade);
  const filteredOps = OPERATIONS.filter(op => availableOps.includes(op.type));
  const todayMinutes = usageData?.totalMinutes || 0;
  const remainingMinutes = Math.max(0, activeChild.dailyLimitMinutes - todayMinutes);
  const usagePercent = Math.min(100, (todayMinutes / activeChild.dailyLimitMinutes) * 100);
  const isTimeUp = remainingMinutes <= 0;

  const handleStartPractice = (operation: string) => {
    if (isTimeUp) return;
    navigate(`/practice/${operation}`);
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col pb-28">
      <div className="px-4 sm:px-6 pt-6 sm:pt-12">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex items-center mb-6">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: activeChild.avatarColor }}
            >
              <span className="text-xl sm:text-2xl font-extrabold text-white">
                {activeChild.name[0].toUpperCase()}
              </span>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 truncate">
                Hi, {activeChild.name}! 👋
              </h1>
              <p className="text-slate-500 text-sm sm:text-base">Grade {activeChild.grade}</p>
            </div>
          </div>

          <div className="card mb-6 p-4 sm:p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-500 font-semibold text-xs sm:text-sm">Today's Learning Time</span>
              <span className="text-teal-500 font-extrabold text-base sm:text-lg">{remainingMinutes} min left</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  backgroundColor: isTimeUp ? "#EF4444" : "#14B8A6",
                }}
              />
            </div>
            {isTimeUp && (
              <p className="text-red-500 text-center mt-3 font-semibold text-sm">
                Time's up for today! Come back tomorrow
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 min-w-0 truncate">Choose Your Adventure!</h2>
            <button
              onClick={() => setVoiceModeEnabled(!voiceModeEnabled)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 flex-shrink-0 ${
                voiceModeEnabled
                  ? "bg-indigo-100 text-indigo-600 shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
              data-testid="button-toggle-voice"
            >
              <span>🎤</span>
              <span className="text-xs font-semibold">{voiceModeEnabled ? "On" : "Off"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredOps.map((op, index) => {
              const isLastOdd = filteredOps.length % 2 !== 0 && index === filteredOps.length - 1;
              return (
                <button
                  key={op.type}
                  onClick={() => handleStartPractice(op.type)}
                  disabled={isTimeUp}
                  className={`card card-interactive text-center p-4 sm:p-6 ${
                    isTimeUp ? "opacity-50 pointer-events-none" : ""
                  } ${isLastOdd ? "col-span-2 max-w-[50%] mx-auto w-full" : ""}`}
                  data-testid={`button-practice-${op.type}`}
                >
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3"
                    style={{ backgroundColor: `${op.color}20` }}
                  >
                    <span className="text-2xl sm:text-3xl">{op.icon}</span>
                  </div>
                  <div className="font-bold text-slate-700 text-sm sm:text-base">{op.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{op.desc}</div>
                </button>
              );
            })}
          </div>

          {availableOps.length < 5 && (
            <div className="card mt-6 text-center p-4 sm:p-5">
              <p className="font-bold text-slate-700 text-sm sm:text-base">More topics unlock as you advance!</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Keep practicing to unlock new math adventures.</p>
            </div>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 sm:px-6 py-3 sm:py-4 z-10 safe-bottom">
        <div className="max-w-[800px] mx-auto flex justify-around">
          <button
            className="flex flex-col items-center text-indigo-500 py-1 px-4 transition-colors"
            data-testid="nav-learn"
          >
            <span className="text-2xl">📚</span>
            <span className="text-xs font-semibold mt-1">Learn</span>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center text-slate-400 py-1 px-4 hover:text-slate-600 transition-colors"
            data-testid="nav-parent"
          >
            <span className="text-2xl">👨‍👩‍👧</span>
            <span className="text-xs font-semibold mt-1">Parent</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
