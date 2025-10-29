
import React, { FormEvent } from 'react';

interface DockProps {
  userInput: string;
  setUserInput: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  error: string | null;
}

const Dock: React.FC<DockProps> = ({ userInput, setUserInput, onGenerate, isLoading, error }) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onGenerate();
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[200] slide-up">
      {error && (
        <div className="mb-3 p-3 bg-red-500/90 backdrop-blur-lg text-white text-center rounded-xl border border-red-400/30 shadow-lg text-sm font-medium">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative dock-container rounded-full p-1.5">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask AI what you want to do... (e.g., 'email client', 'todo list', 'calculator')"
            className="w-full h-14 pl-6 pr-36 bg-white/5 border-0 rounded-full text-white placeholder-gray-400 focus:outline-none input-focus transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-11 px-7 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all shadow-lg btn-hover"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Dock;
