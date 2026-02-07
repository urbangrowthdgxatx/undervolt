"use client";

import { useState } from "react";
import { RefreshCw, Send, Lock } from "lucide-react";

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

// 32 unique positions arranged in concentric rings - closer to center, more questions
const FLOAT_POSITIONS = [
  // Inner ring (near) - 8 positions, amber - closest to center
  { x: -22, y: -18, delay: 0, depth: 'near' },
  { x: 22, y: -18, delay: 0.4, depth: 'near' },
  { x: -25, y: 8, delay: 0.8, depth: 'near' },
  { x: 25, y: 8, delay: 1.2, depth: 'near' },
  { x: -18, y: 22, delay: 1.6, depth: 'near' },
  { x: 18, y: 22, delay: 2.0, depth: 'near' },
  { x: -10, y: -22, delay: 2.4, depth: 'near' },
  { x: 10, y: -22, delay: 2.8, depth: 'near' },

  // Middle ring (mid) - 12 positions, blue
  { x: -35, y: -12, delay: 0.2, depth: 'mid' },
  { x: 35, y: -12, delay: 0.6, depth: 'mid' },
  { x: -38, y: 15, delay: 1.0, depth: 'mid' },
  { x: 38, y: 15, delay: 1.4, depth: 'mid' },
  { x: -12, y: -32, delay: 1.8, depth: 'mid' },
  { x: 12, y: -32, delay: 2.2, depth: 'mid' },
  { x: -15, y: 32, delay: 2.6, depth: 'mid' },
  { x: 15, y: 32, delay: 3.0, depth: 'mid' },
  { x: -32, y: -25, delay: 3.4, depth: 'mid' },
  { x: 32, y: -25, delay: 3.8, depth: 'mid' },
  { x: -30, y: 28, delay: 4.2, depth: 'mid' },
  { x: 30, y: 28, delay: 4.6, depth: 'mid' },

  // Outer ring (far) - 12 positions, purple
  { x: -45, y: -22, delay: 0.3, depth: 'far' },
  { x: 45, y: -22, delay: 0.7, depth: 'far' },
  { x: -48, y: 5, delay: 1.1, depth: 'far' },
  { x: 48, y: 5, delay: 1.5, depth: 'far' },
  { x: -42, y: 28, delay: 1.9, depth: 'far' },
  { x: 42, y: 28, delay: 2.3, depth: 'far' },
  { x: -28, y: -38, delay: 2.7, depth: 'far' },
  { x: 28, y: -38, delay: 3.1, depth: 'far' },
  { x: -25, y: 40, delay: 3.5, depth: 'far' },
  { x: 25, y: 40, delay: 3.9, depth: 'far' },
  { x: -5, y: 38, delay: 4.3, depth: 'far' },
  { x: 5, y: -38, delay: 4.7, depth: 'far' },
] as const;

// Get depth-specific styles with color gradient
const getDepthStyles = (depth: 'near' | 'mid' | 'far') => {
  switch (depth) {
    case 'near':
      return {
        scale: 1.15,
        opacity: 1,
        blur: 0,
        zIndex: 30,
        animation: 'animate-float',
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.4)',
        text: 'rgba(253, 230, 138, 1)',
        shadow: '0 0 20px rgba(251, 191, 36, 0.2)',
      };
    case 'mid':
      return {
        scale: 0.95,
        opacity: 0.85,
        blur: 0,
        zIndex: 20,
        animation: 'animate-float',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.3)',
        text: 'rgba(147, 197, 253, 0.9)',
        shadow: '0 0 15px rgba(59, 130, 246, 0.15)',
      };
    case 'far':
      return {
        scale: 0.75,
        opacity: 0.5,
        blur: 0.5,
        zIndex: 10,
        animation: 'animate-float-slow',
        bg: 'rgba(139, 92, 246, 0.08)',
        border: 'rgba(139, 92, 246, 0.2)',
        text: 'rgba(196, 181, 253, 0.7)',
        shadow: 'none',
      };
  }
};

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
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");

  const handleClick = (question: string, index: number) => {
    setClickedIndex(index);
    onQuestionClick(question);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    // Require signup for custom questions
    if (!userEmail) {
      onSignupClick?.();
      return;
    }
    onQuestionClick(customQuestion.trim());
    setCustomQuestion("");
  };

  // Collapsed mode - horizontal scrollable row
  if (collapsed) {
    return (
      <div className="relative">
        {/* Horizontal scroll container */}
        <div
          className="flex gap-3 overflow-x-auto py-3 px-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {questions.slice(0, 6).map((question, index) => {
            const depthIndex = index % 3;
            const depth = depthIndex === 0 ? 'near' : depthIndex === 1 ? 'mid' : 'far';
            const styles = getDepthStyles(depth);

            return (
              <button
                key={`${question}-${index}`}
                onClick={() => handleClick(question, index)}
                disabled={isLoading}
                style={{
                  backgroundColor: styles.bg,
                  borderColor: styles.border,
                  color: styles.text,
                }}
                className="flex-shrink-0 px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-all hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            );
          })}

          {/* Refresh button in row */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-shrink-0 px-4 py-2 rounded-full border border-white/20 bg-white/5 text-white/50 text-sm whitespace-nowrap hover:text-white hover:border-white/40 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>
    );
  }

  // Expanded mode - full floating layout
  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] flex items-center justify-center perspective-container">
      {/* Title - centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-40 w-full max-w-xl px-4">
        {storylineTitle ? (
          <>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Investigating</p>
            <h1 className="text-3xl md:text-4xl font-light text-white mb-6 tracking-tight">
              {storylineTitle}
            </h1>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-extralight text-white mb-3 tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              How will your story evolve?
            </h1>
            <p className="text-white/40 text-base mb-6">
              Click a question or ask your own
            </p>
          </>
        )}

        {/* Custom question input */}
        <form onSubmit={handleCustomSubmit} className="mb-4">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder={userEmail ? "Ask anything about Austin permits..." : "Sign up to ask custom questions..."}
              disabled={isLoading}
              className={`w-full px-5 py-3 pr-12 rounded-full border text-white text-sm focus:outline-none transition-all disabled:opacity-50 ${
                userEmail
                  ? "bg-white/5 border-white/20 placeholder-white/30 focus:border-white/40 focus:bg-white/10"
                  : "bg-white/[0.02] border-white/10 placeholder-white/20 cursor-pointer"
              }`}
              onClick={() => !userEmail && onSignupClick?.()}
            />
            <button
              type="submit"
              disabled={isLoading || !customQuestion.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
            >
              {userEmail ? <Send size={16} /> : <Lock size={16} />}
            </button>
          </div>
        </form>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          <span>New questions</span>
        </button>

        {/* Loading indicator */}
        {isLoading && (
          <div className="mt-6 flex items-center justify-center gap-3 text-white/50">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="text-sm">Exploring...</span>
          </div>
        )}
      </div>

      {/* Floating questions with 3D depth and color */}
      {questions.slice(0, 6).map((question, index) => {
        const pos = FLOAT_POSITIONS[index % FLOAT_POSITIONS.length];
        const depthStyles = getDepthStyles(pos.depth);
        const isClicked = clickedIndex === index;
        const isOtherClicked = clickedIndex !== null && clickedIndex !== index;

        return (
          <button
            key={`${question}-${index}`}
            onClick={() => handleClick(question, index)}
            disabled={isLoading}
            style={{
              position: 'absolute',
              left: `calc(50% + ${pos.x}%)`,
              top: `calc(50% + ${pos.y}%)`,
              transform: `translate(-50%, -50%) scale(${isOtherClicked ? depthStyles.scale * 0.9 : depthStyles.scale})`,
              animationDelay: `${pos.delay}s`,
              opacity: isOtherClicked ? 0.15 : depthStyles.opacity,
              filter: `blur(${depthStyles.blur}px)`,
              zIndex: isClicked ? 50 : depthStyles.zIndex,
              boxShadow: isClicked ? '0 0 40px rgba(255,255,255,0.4)' : depthStyles.shadow,
              backgroundColor: depthStyles.bg,
              borderColor: depthStyles.border,
              color: depthStyles.text,
            }}
            className={`
              px-4 py-2.5 rounded-full
              border text-sm whitespace-nowrap
              transition-all duration-300 ease-out
              hover:!opacity-100 hover:!filter-none hover:!scale-110
              hover:brightness-125
              disabled:opacity-50 disabled:cursor-not-allowed
              ${depthStyles.animation}
              ${isClicked ? "!scale-95 brightness-150" : ""}
            `}
          >
            {question}
          </button>
        );
      })}

    </div>
  );
}
