import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";

const OPERATION_ICONS: Record<string, string> = {
  addition: "➕",
  subtraction: "➖",
  multiplication: "✖️",
  division: "➗",
  geometry: "📐",
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const parent = useAuthStore((s) => s.parent);
  const activeChild = useAuthStore((s) => s.activeChild);
  const children = useAuthStore((s) => s.children);
  const setActiveChild = useAuthStore((s) => s.setActiveChild);
  const activePractice = useAuthStore((s) => s.activePractice);
  const setSidebarOpen = useAuthStore((s) => s.setSidebarOpen);

  const { data: sessions } = useQuery({
    queryKey: ["sessions", activeChild?.id],
    queryFn: () => activeChild ? api.sessions.list(activeChild.id) : [],
    enabled: !!activeChild,
  });

  const { data: usageData } = useQuery({
    queryKey: ["usage", activeChild?.id],
    queryFn: () => activeChild ? api.usage.get(activeChild.id) : null,
    enabled: !!activeChild,
  });

  const handleSwitchChild = (child: typeof activeChild) => {
    if (child) {
      setActiveChild(child);
    }
  };

  if (!parent) return null;

  const totalStars = sessions?.reduce((acc, s) => acc + s.score, 0) || 0;
  const todayMinutes = usageData?.totalMinutes || 0;
  const isChildInPractice = activePractice && activeChild && activePractice.childId === activeChild.id;

  return (
    <div className="min-h-screen min-h-dvh flex flex-col pb-8">
      <div className="px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-white rounded-xl shadow flex items-center justify-center text-slate-500 hover:bg-slate-50 flex-shrink-0"
              data-testid="button-open-sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Parent Dashboard</h1>
              <p className="text-slate-500 truncate text-sm">Welcome, {parent.name}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-700">Children</h2>
            <button
              onClick={() => navigate("/add-child")}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              data-testid="button-add-child"
            >
              + Add
            </button>
          </div>

          {children.length === 0 ? (
            <div className="card p-6 text-center mb-6">
              <p className="text-slate-500 mb-4">No children added yet</p>
              <button
                onClick={() => navigate("/add-child")}
                className="btn-primary w-full sm:w-auto px-6"
                data-testid="button-add-first-child"
              >
                Add Your First Child
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {children.map((child) => {
                const isActive = activeChild?.id === child.id;
                return (
                  <button
                    key={child.id}
                    onClick={() => handleSwitchChild(child)}
                    className={`card card-interactive w-full p-3 sm:p-4 flex items-center text-left relative ${
                      isActive ? "ring-2 ring-indigo-500" : ""
                    }`}
                    data-testid={`button-child-${child.id}`}
                  >
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: child.avatarColor }}
                    >
                      <span className="text-lg sm:text-xl font-bold text-white">{child.name[0].toUpperCase()}</span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="font-bold text-slate-700 truncate text-sm sm:text-base">{child.name}</p>
                      <p className="text-xs sm:text-sm text-slate-500">Grade {child.grade}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-teal-500 font-bold text-sm sm:text-base">
                        {isActive && todayMinutes ? todayMinutes : 0}/{child.dailyLimitMinutes}
                      </p>
                      <p className="text-xs text-slate-400">min today</p>
                    </div>
                    {isActive && (
                      <span className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-lg font-semibold">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {isChildInPractice && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                In Progress
              </h2>
              <div className="card p-4 border-2 border-green-200 bg-green-50/50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{OPERATION_ICONS[activePractice.operation] || "📝"}</span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 capitalize text-sm sm:text-base">{activePractice.operation}</p>
                    <p className="text-xs text-slate-500">
                      Started {new Date(activePractice.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-green-600 font-bold text-base sm:text-lg">
                      {activePractice.questionIndex}/{activePractice.totalQuestions}
                    </p>
                    <p className="text-xs text-slate-400">questions</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(activePractice.questionIndex / activePractice.totalQuestions) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-slate-500">Score: ⭐ {activePractice.score}</span>
                    <span className="text-xs text-green-600 font-semibold">In Progress</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeChild && sessions && sessions.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-slate-700 mb-4">Completed Sessions</h2>
              <div className="space-y-2 mb-6">
                {sessions.slice(0, 10).map((session, index) => (
                  <div key={index} className="card p-3 sm:p-4 flex items-center">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-base sm:text-lg">{OPERATION_ICONS[session.operationType] || "📝"}</span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 capitalize text-sm sm:text-base">{session.operationType}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {new Date(session.completedAt).toLocaleDateString()} at{" "}
                        {new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-indigo-500 font-bold text-sm sm:text-base">
                        {session.score}/{session.totalQuestions}
                      </p>
                      <p className="text-xs text-slate-400">
                        {Math.round((session.score / session.totalQuestions) * 100)}% · {
                          session.timeSpentSeconds >= 60
                            ? `${Math.floor(session.timeSpentSeconds / 60)}m ${session.timeSpentSeconds % 60}s`
                            : `${session.timeSpentSeconds}s`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-4 sm:p-5 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold text-sm sm:text-base">Total Stars Earned</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-500">⭐ {totalStars}</span>
                </div>
              </div>
            </>
          )}

          {activeChild && (!sessions || sessions.length === 0) && !isChildInPractice && (
            <div className="card p-6 text-center mb-6">
              <p className="text-slate-500">No practice sessions yet</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
