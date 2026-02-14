"use client";

import { useState } from "react";
import { RefreshCw, Send } from "lucide-react";

interface FloatingQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  storylineTitle?: string;
  collapsed?: boolean;
  userEmail?: string | null;
  onSignupClick?: () => void;
}

// Circular positions around center (like a clock)
const CIRCLE_POSITIONS = [
  { angle: -90, radius: 30 },   // top
  { angle: -30, radius: 30 },   // top-right
  { angle: 30, radius: 30 },    // bottom-right
  { angle: 90, radius: 30 },    // bottom
  { angle: 150, radius: 30 },   // bottom-left
  { angle: 210, radius: 30 },   // top-left
];

export function FloatingQuestions({
  questions,
  onQuestionClick,
  onRefresh,
  isLoading,
  isRefreshing,
  storylineTitle,
  collapsed = false,
  userEmail,
  onSignupClick,
}: FloatingQuestionsProps) {
  const [customQuestion, setCustomQuestion] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    if (!userEmail) {
      onSignupClick?.();
      return;
    }
    onQuestionClick(customQuestion.trim());
    setCustomQuestion("");
  };

  // Collapsed mode
  if (collapsed) {
    return (
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto py-3 px-4" style={{ scrollbarWidth: "none" }}>
          {questions.slice(0, 6).map((question, index) => (
            <button
              key={`${question}-${index}`}
              onClick={() => onQuestionClick(question)}
              disabled={isLoading}
              className="flex-shrink-0 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm whitespace-nowrap hover:bg-amber-500/20 transition-all disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full page - circular word cloud
  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
      <div className="relative w-full max-w-4xl aspect-square max-h-[80vh]">
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-8 max-w-md">
            {storylineTitle ? (
              <>
                <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Investigating</p>
                <h1 className="text-2xl md:text-3xl font-light text-white mb-6">
                  {storylineTitle}
                </h1>
              </>
            ) : (
              <h1 className="text-2xl md:text-3xl font-light text-white mb-6">
                Explore Austin&apos;s Data
              </h1>
            )}

            {/* Input */}
            <form onSubmit={handleCustomSubmit} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Ask anything..."
                  disabled={isLoading}
                  onClick={() => !userEmail && onSignupClick?.()}
                  className="w-full px-5 py-3 pr-12 rounded-full border border-white/20 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !customQuestion.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-white/30 hover:text-white/60 text-xs inline-flex items-center gap-2"
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
              New questions
            </button>

            {isLoading && (
              <div className="mt-6 flex items-center justify-center gap-2 text-white/50">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>
        </div>

        {/* Circular question cloud */}
        {questions.slice(0, 7).map((question, index) => {
          const pos = CIRCLE_POSITIONS[index];
          const angleRad = (pos.angle * Math.PI) / 180;
          const x = 50 + pos.radius * Math.cos(angleRad);
          const y = 50 + pos.radius * Math.sin(angleRad);
          const isHighlighted = index < 3;

          return (
            <button
              key={`${question}-${index}`}
              onClick={() => onQuestionClick(question)}
              disabled={isLoading}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all hover:scale-105 disabled:opacity-50 ${
                isHighlighted
                  ? 'border border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                  : 'border border-white/20 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {question}
            </button>
          );
        })}
      </div>
    </div>
  );
}
