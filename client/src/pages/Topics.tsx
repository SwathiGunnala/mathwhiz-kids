import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { getTopicsForGrade, PROFICIENCY_INFO, getProficiencyLevel, type GradeLevel, type TopicDefinition, type TopicProgress } from "@shared/schema";

export default function Topics() {
  const [, navigate] = useLocation();
  const activeChild = useAuthStore((s) => s.activeChild);
  const setSidebarOpen = useAuthStore((s) => s.setSidebarOpen);

  const { data: progressData } = useQuery({
    queryKey: ["topicProgress", activeChild?.id],
    queryFn: () => activeChild ? api.topicProgress.getAll(activeChild.id) : [],
    enabled: !!activeChild,
  });

  const { data: usageData } = useQuery({
    queryKey: ["usage", activeChild?.id],
    queryFn: () => activeChild ? api.usage.get(activeChild.id) : null,
    enabled: !!activeChild,
    refetchInterval: 30000,
  });

  if (!activeChild) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-4">
        <span className="text-7xl mb-6">👋</span>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-3 text-center">Welcome!</h1>
        <p className="text-slate-500 text-center mb-8">Let's add your child to get started</p>
        <button
          onClick={() => navigate("/add-child")}
          className="btn-primary text-lg px-8 py-4 w-full max-w-xs"
          data-testid="button-add-child"
        >
          Add Child
        </button>
      </div>
    );
  }

  const topics = getTopicsForGrade(activeChild.grade as GradeLevel);
  const progressMap = new Map<string, TopicProgress>();
  progressData?.forEach((p) => progressMap.set(p.topicId, p));

  const todayMinutes = usageData?.totalMinutes || 0;
  const remainingMinutes = Math.max(0, activeChild.dailyLimitMinutes - todayMinutes);
  const usagePercent = Math.min(100, (todayMinutes / activeChild.dailyLimitMinutes) * 100);
  const isTimeUp = remainingMinutes <= 0;

  return (
    <div className="min-h-screen min-h-dvh flex flex-col pb-6">
      <div className="px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex items-center mb-5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-white rounded-xl shadow flex items-center justify-center text-slate-500 hover:bg-slate-50 mr-3 flex-shrink-0"
              data-testid="button-open-sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: activeChild.avatarColor }}
            >
              <span className="text-xl font-extrabold text-white">
                {activeChild.name[0].toUpperCase()}
              </span>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <h1 className="text-xl font-extrabold text-slate-800 truncate">
                Hi, {activeChild.name}! 👋
              </h1>
              <p className="text-slate-500 text-sm">Grade {activeChild.grade}</p>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xl shadow flex-shrink-0 ml-2">
              <span className="font-bold text-amber-500 text-sm">{activeChild.totalCredits || 0} credits</span>
            </div>
          </div>

          <div className="card mb-5 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500 font-semibold text-sm">Today's Learning Time</span>
              <span className="text-teal-500 font-extrabold">{remainingMinutes} min left</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  backgroundColor: isTimeUp ? "#EF4444" : "#14B8A6",
                }}
              />
            </div>
            {isTimeUp && (
              <p className="text-red-500 text-center mt-2 text-sm font-semibold">
                Time's up for today! Come back tomorrow
              </p>
            )}
          </div>

          <h2 className="text-lg font-extrabold text-slate-800 mb-4">Math Topics</h2>

          <div className="space-y-3">
            {topics.map((topic) => {
              const progress = progressMap.get(topic.id);
              const proficiency = progress ? (progress.proficiencyLevel as any) : "beginner";
              const profInfo = PROFICIENCY_INFO[proficiency as keyof typeof PROFICIENCY_INFO];
              const credits = progress?.totalCredits || 0;
              const sessionsCount = progress?.sessionsCompleted || 0;

              return (
                <button
                  key={topic.id}
                  onClick={() => !isTimeUp && navigate(`/topic/${topic.id}`)}
                  disabled={isTimeUp}
                  className={`card card-interactive w-full p-4 text-left flex items-center gap-3 ${
                    isTimeUp ? "opacity-50 pointer-events-none" : ""
                  }`}
                  data-testid={`topic-${topic.id}`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${topic.color}15` }}
                  >
                    <span className="text-2xl">{topic.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-700 text-sm truncate">{topic.name}</p>
                      <span className="text-xs" title={profInfo.label}>{profInfo.icon}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{topic.description}</p>
                    {sessionsCount > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (credits / 100) * 100)}%`,
                              backgroundColor: profInfo.color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{credits} credits</span>
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          {topics.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-slate-500">No topics available for this grade level yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
