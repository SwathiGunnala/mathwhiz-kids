import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";

const GRADES = [
  { label: "Kindergarten", value: "K" },
  { label: "1st Grade", value: "1" },
  { label: "2nd Grade", value: "2" },
  { label: "3rd Grade", value: "3" },
  { label: "4th Grade", value: "4" },
  { label: "5th Grade", value: "5" },
];

const TIME_LIMITS = [10, 15, 20, 30, 45, 60];

const COLORS = [
  "#6366F1", "#F59E0B", "#14B8A6", "#EC4899", "#8B5CF6", "#22C55E"
];

export default function AddChild() {
  const [, navigate] = useLocation();
  const parent = useAuthStore((s) => s.parent);
  const children = useAuthStore((s) => s.children);
  const addChild = useAuthStore((s) => s.addChild);
  const setActiveChild = useAuthStore((s) => s.setActiveChild);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("K");
  const [dailyLimit, setDailyLimit] = useState(20);
  const [avatarColor, setAvatarColor] = useState(COLORS[0]);
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.children.create({
        parentId: parent!.id,
        name,
        grade,
        dailyLimitMinutes: dailyLimit,
        avatarColor,
      }),
    onSuccess: (child) => {
      addChild(child);
      setActiveChild(child);
      navigate("/");
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your child's name");
      return;
    }
    setError("");
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col px-4 sm:px-8 pt-10 sm:pt-16 pb-8 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1">
        {children.length > 0 && (
          <button
            onClick={() => navigate("/")}
            className="text-indigo-500 font-semibold mb-6 text-left py-2 pr-4 hover:text-indigo-700 transition-colors self-start"
            data-testid="button-back"
          >
            ← Back
          </button>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">Add Your Child</h1>
        <p className="text-slate-500 mb-6 sm:mb-8">Set up a profile for your little learner</p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium" data-testid="text-error">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-3">Child's Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="input-field"
              autoComplete="off"
              data-testid="input-child-name"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-3">Avatar Color</label>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-150 flex items-center justify-center ${
                    avatarColor === color ? "ring-4 ring-offset-2 ring-slate-300 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  data-testid={`button-color-${color}`}
                >
                  {avatarColor === color && (
                    <span className="text-white font-bold text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-3">Grade Level</label>
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGrade(g.value)}
                  className={`py-3 px-2 sm:px-4 rounded-xl border-2 transition-all duration-150 ${
                    grade === g.value
                      ? "bg-indigo-500 border-indigo-500 text-white shadow-md"
                      : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                  data-testid={`button-grade-${g.value}`}
                >
                  <div className="text-xl sm:text-2xl font-extrabold">{g.value}</div>
                  <div className="text-[10px] sm:text-xs mt-1 opacity-80 truncate">{g.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-2">Daily Time Limit</label>
            <p className="text-slate-500 text-sm mb-3">How long can they play each day?</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_LIMITS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDailyLimit(t)}
                  className={`py-3 px-3 sm:px-5 rounded-xl border-2 transition-all duration-150 font-semibold text-sm sm:text-base ${
                    dailyLimit === t
                      ? "bg-teal-500 border-teal-500 text-white shadow-md"
                      : "bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                  }`}
                  data-testid={`button-limit-${t}`}
                >
                  {t} min
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary w-full text-lg py-4 mt-6"
            data-testid="button-add-child"
          >
            {createMutation.isPending ? "Adding..." : "Add Child & Start"}
          </button>
        </form>
      </div>
    </div>
  );
}
