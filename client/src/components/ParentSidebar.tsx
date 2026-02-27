import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";

const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90];

export default function ParentSidebar() {
  const [, navigate] = useLocation();
  const parent = useAuthStore((s) => s.parent);
  const children = useAuthStore((s) => s.children);
  const activeChild = useAuthStore((s) => s.activeChild);
  const setActiveChild = useAuthStore((s) => s.setActiveChild);
  const updateChildInStore = useAuthStore((s) => s.updateChildInStore);
  const sidebarOpen = useAuthStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAuthStore((s) => s.setSidebarOpen);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const { data: usageData } = useQuery({
    queryKey: ["usage", activeChild?.id],
    queryFn: () => activeChild ? api.usage.get(activeChild.id) : null,
    enabled: !!activeChild,
    refetchInterval: 30000,
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", activeChild?.id],
    queryFn: () => activeChild ? api.sessions.list(activeChild.id) : [],
    enabled: !!activeChild,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<any> }) => api.children.update(id, data),
    onSuccess: (child) => {
      updateChildInStore(child.id, child);
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const handleTimeChange = (childId: number, newLimit: number) => {
    updateMutation.mutate({ id: childId, data: { dailyLimitMinutes: newLimit } });
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      setSidebarOpen(false);
      navigate("/");
    }
  };

  if (!parent) return null;

  const todayMinutes = usageData?.totalMinutes || 0;
  const totalStars = sessions?.reduce((acc, s) => acc + s.score, 0) || 0;
  const totalSessions = sessions?.length || 0;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-extrabold text-slate-800">Parent Menu</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
            data-testid="button-close-sidebar"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-500">Welcome, {parent.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Children</h3>
          <div className="space-y-2">
            {children.map((child) => {
              const isActive = activeChild?.id === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setActiveChild(child)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isActive ? "bg-indigo-50 ring-2 ring-indigo-200" : "hover:bg-slate-50"
                  }`}
                  data-testid={`sidebar-child-${child.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: child.avatarColor }}
                  >
                    <span className="text-sm font-bold text-white">{child.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 text-sm truncate">{child.name}</p>
                    <p className="text-xs text-slate-400">Grade {child.grade}</p>
                  </div>
                  {isActive && (
                    <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-semibold">Active</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => { navigate("/add-child"); setSidebarOpen(false); }}
            className="w-full mt-2 py-2.5 text-sm font-semibold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            data-testid="sidebar-add-child"
          >
            + Add Child
          </button>
        </div>

        {activeChild && (
          <>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Time Limit</h3>
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-600">{activeChild.name}'s Daily Limit</span>
                  <span className="text-sm font-bold text-indigo-500">{activeChild.dailyLimitMinutes} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const current = activeChild.dailyLimitMinutes;
                      const idx = TIME_OPTIONS.indexOf(current);
                      if (idx > 0) handleTimeChange(activeChild.id, TIME_OPTIONS[idx - 1]);
                      else if (current > 5) handleTimeChange(activeChild.id, Math.max(5, current - 5));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg transition-colors"
                    data-testid="button-decrease-time"
                  >
                    -
                  </button>
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (activeChild.dailyLimitMinutes / 90) * 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const current = activeChild.dailyLimitMinutes;
                      const idx = TIME_OPTIONS.indexOf(current);
                      if (idx >= 0 && idx < TIME_OPTIONS.length - 1) handleTimeChange(activeChild.id, TIME_OPTIONS[idx + 1]);
                      else if (current < 90) handleTimeChange(activeChild.id, Math.min(90, current + 5));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg transition-colors"
                    data-testid="button-increase-time"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>5 min</span>
                  <span>90 min</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Today's Progress</h3>
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Time Used</span>
                  <span className="text-sm font-bold text-teal-500">{todayMinutes} / {activeChild.dailyLimitMinutes} min</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (todayMinutes / activeChild.dailyLimitMinutes) * 100)}%`,
                      backgroundColor: todayMinutes >= activeChild.dailyLimitMinutes ? "#EF4444" : "#14B8A6",
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="text-center p-2 bg-amber-50 rounded-lg">
                    <p className="text-lg font-extrabold text-amber-500">{totalStars}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Total Stars</p>
                  </div>
                  <div className="text-center p-2 bg-indigo-50 rounded-lg">
                    <p className="text-lg font-extrabold text-indigo-500">{totalSessions}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Sessions</p>
                  </div>
                </div>
                <div className="text-center p-2 bg-emerald-50 rounded-lg">
                  <p className="text-lg font-extrabold text-emerald-500">{activeChild.totalCredits || 0}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Credits Earned</p>
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Navigation</h3>
          <div className="space-y-1">
            <button
              onClick={() => { navigate("/"); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left"
              data-testid="sidebar-nav-learn"
            >
              <span className="text-lg">📚</span> Learning Home
            </button>
            <button
              onClick={() => { navigate("/dashboard"); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left"
              data-testid="sidebar-nav-dashboard"
            >
              <span className="text-lg">📊</span> Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl font-semibold text-red-500 bg-white border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all text-sm"
          data-testid="sidebar-logout"
        >
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 bg-white shadow-lg z-30 overflow-hidden" data-testid="sidebar-desktop">
        {sidebarContent}
      </div>

      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-xl z-50 animate-slide-in overflow-hidden" data-testid="sidebar-mobile">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
