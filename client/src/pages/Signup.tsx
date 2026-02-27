import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";

export default function Signup() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const setParent = useAuthStore((s) => s.setParent);

  const signupMutation = useMutation({
    mutationFn: () => api.auth.signup({ email, password, name }),
    onSuccess: (parent) => {
      setParent(parent);
      navigate("/add-child");
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    signupMutation.mutate();
  };

  const EyeIcon = ({ show }: { show: boolean }) => show ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

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

        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Create Account</h1>
        <p className="text-slate-500 mb-6 sm:mb-8">Set up your parent account</p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium" data-testid="text-error">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className="input-field"
              required
              autoComplete="name"
              data-testid="input-name"
            />
          </div>

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
                placeholder="At least 6 characters"
                className="input-field pr-12"
                required
                autoComplete="new-password"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                data-testid="button-toggle-password"
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="input-field pr-12"
                required
                autoComplete="new-password"
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                data-testid="button-toggle-confirm-password"
              >
                <EyeIcon show={showConfirmPassword} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="btn-primary w-full text-lg py-4 mt-4"
            data-testid="button-signup"
          >
            {signupMutation.isPending ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-auto pt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-slate-500 py-3 hover:text-indigo-500 transition-colors w-full text-center"
            data-testid="button-login-link"
          >
            Already have an account? <span className="text-indigo-500 font-semibold">Log In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
