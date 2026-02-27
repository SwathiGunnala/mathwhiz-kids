import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const setParent = useAuthStore((s) => s.setParent);
  const setChildren = useAuthStore((s) => s.setChildren);
  const setActiveChild = useAuthStore((s) => s.setActiveChild);

  const loginMutation = useMutation({
    mutationFn: () => api.auth.login({ email, password }),
    onSuccess: async (parent) => {
      setParent(parent);
      const children = await api.children.list(parent.id);
      setChildren(children);
      if (children.length > 0) {
        setActiveChild(children[0]);
      }
      navigate("/");
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col px-4 sm:px-8 pt-10 sm:pt-16 pb-8 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1">
        <button
          onClick={() => navigate("/")}
          className="text-indigo-500 font-semibold mb-6 text-left py-2 pr-4 hover:text-indigo-700 transition-colors self-start"
          data-testid="button-back"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome Back!</h1>
        <p className="text-slate-500 mb-6 sm:mb-10">Log in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium" data-testid="text-error">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="input-field"
              required
              autoComplete="email"
              data-testid="input-email"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field pr-12"
                required
                autoComplete="current-password"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                data-testid="button-toggle-password"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="btn-primary w-full text-lg py-4 mt-6"
            data-testid="button-login"
          >
            {loginMutation.isPending ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-auto pt-6 text-center space-y-2">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-indigo-500 font-semibold py-2 hover:text-indigo-700 transition-colors text-sm w-full text-center"
            data-testid="button-forgot-password"
          >
            Forgot your password?
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="text-slate-500 py-3 hover:text-indigo-500 transition-colors w-full text-center"
            data-testid="button-signup-link"
          >
            Don't have an account? <span className="text-indigo-500 font-semibold">Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
}
