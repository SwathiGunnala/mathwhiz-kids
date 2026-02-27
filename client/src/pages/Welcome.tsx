import { useLocation } from "wouter";

const features = [
  { icon: "📚", text: "Story-Based Learning", desc: "Math through fun stories" },
  { icon: "🎯", text: "Adapts to Your Child", desc: "K through 5th grade" },
  { icon: "⏰", text: "Parent-Set Time Limits", desc: "You stay in control" },
  { icon: "🎤", text: "Optional Voice Mode", desc: "Problems read aloud" },
];

export default function Welcome() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen min-h-dvh flex flex-col px-4 sm:px-8 pt-10 sm:pt-20 pb-8 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1">
        <div className="text-center mb-6 sm:mb-8 animate-bounce-in">
          <div className="relative inline-block mb-4 sm:mb-6">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white shadow-xl flex items-center justify-center">
              <span className="text-4xl sm:text-6xl">🤖</span>
            </div>
            <span className="absolute -top-2 -right-2 text-2xl">✨</span>
            <span className="absolute bottom-2 -left-4 text-xl">⭐</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold">
            <span className="text-indigo-500">Math</span>
            <span className="text-amber-500">Whiz</span>
          </h1>
          <p className="text-slate-500 mt-2 text-base sm:text-lg">Making Math Fun for Kids!</p>
        </div>

        <div className="space-y-3 mb-6 sm:mb-10">
          {features.map((f, i) => (
            <div
              key={i}
              className="card flex items-center animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-2xl sm:text-3xl mr-3 sm:mr-4 flex-shrink-0">{f.icon}</span>
              <div className="min-w-0">
                <span className="text-slate-700 font-semibold block text-sm sm:text-base truncate">{f.text}</span>
                <span className="text-slate-400 text-xs sm:text-sm">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-3 sm:space-y-4">
          <button
            onClick={() => navigate("/signup")}
            className="btn-primary w-full text-lg py-4"
            data-testid="button-get-started"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 text-slate-500 font-medium transition-colors hover:text-indigo-500 text-center"
            data-testid="button-login-link"
          >
            Already have an account? <span className="text-indigo-500 font-semibold">Log In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
