import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

type Step = "email" | "verify" | "success";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const requestResetMutation = useMutation({
    mutationFn: () => api.auth.requestReset({ email }),
    onSuccess: (data) => {
      setToken(data.token);
      setDisplayCode(data.code);
      setStep("verify");
    },
    onError: (err: Error) => setError(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => api.auth.resetPassword({ token, code: verificationCode, newPassword }),
    onSuccess: () => {
      setStep("success");
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    requestResetMutation.mutate();
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    resetPasswordMutation.mutate();
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

  if (step === "success") {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Password Reset!</h1>
          <p className="text-slate-500 mb-8">Your password has been updated successfully.</p>
          <button
            onClick={() => navigate("/login")}
            className="btn-primary w-full text-lg py-4"
            data-testid="button-go-login"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col px-4 sm:px-8 pt-10 sm:pt-16 pb-8 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto flex flex-col flex-1">
          <button
            onClick={() => setStep("email")}
            className="text-indigo-500 font-semibold mb-6 text-left py-2 pr-4 hover:text-indigo-700 transition-colors self-start"
            data-testid="button-back"
          >
            ← Back
          </button>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">Verify & Reset</h1>
          <p className="text-slate-500 mb-6">Enter the verification code and choose a new password</p>

          <div className="card p-4 mb-6 bg-indigo-50 border-2 border-indigo-200">
            <p className="text-sm text-indigo-700 font-semibold mb-1">Your Verification Code:</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-widest text-center break-all" data-testid="text-verification-code">
              {displayCode}
            </p>
            <p className="text-xs text-indigo-500 mt-2 text-center">Enter this code below to verify your identity</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium" data-testid="text-error">
                {error}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-2">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter the 6-digit code"
                className="input-field text-center text-lg tracking-widest"
                required
                maxLength={6}
                data-testid="input-verification-code"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-field pr-12"
                  required
                  autoComplete="new-password"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  data-testid="button-toggle-new-password"
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="input-field pr-12"
                  required
                  autoComplete="new-password"
                  data-testid="input-confirm-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  data-testid="button-toggle-confirm-new-password"
                >
                  <EyeIcon show={showConfirmPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="btn-primary w-full text-lg py-4 mt-6"
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col px-4 sm:px-8 pt-10 sm:pt-16 pb-8 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1">
        <button
          onClick={() => navigate("/login")}
          className="text-indigo-500 font-semibold mb-6 text-left py-2 pr-4 hover:text-indigo-700 transition-colors self-start"
          data-testid="button-back"
        >
          ← Back to Login
        </button>

        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Reset Password</h1>
        <p className="text-slate-500 mb-6 sm:mb-10">Enter your email to get a verification code</p>

        <form onSubmit={handleRequestReset} className="space-y-5">
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

          <button
            type="submit"
            disabled={requestResetMutation.isPending}
            className="btn-primary w-full text-lg py-4 mt-6"
            data-testid="button-request-reset"
          >
            {requestResetMutation.isPending ? "Sending..." : "Get Verification Code"}
          </button>
        </form>

        <div className="mt-auto pt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-slate-500 py-3 hover:text-indigo-500 transition-colors w-full text-center"
            data-testid="button-login-link"
          >
            Remember your password? <span className="text-indigo-500 font-semibold">Log In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
