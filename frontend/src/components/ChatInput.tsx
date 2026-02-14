"use client";

import { useState } from "react";
import { Plus, Sparkles, Globe, ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function ChatInput({
  onSubmit,
  placeholder = "Ask anything",
  suggestions = [],
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSubmit(suggestion)}
              className="px-3 py-1.5 text-sm text-gray-400 bg-[#1a1a1a] border border-[#262626] rounded-full hover:border-[#333] hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 focus-within:border-[#333]">
          <button className="text-gray-500 hover:text-white transition-colors">
            <Plus size={18} />
          </button>
          <button className="text-gray-500 hover:text-white transition-colors">
            <Sparkles size={18} />
          </button>
          <button className="text-gray-500 hover:text-white transition-colors">
            <Globe size={18} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 ml-2"
          />

          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              message.trim()
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-[#262626] text-gray-500"
            }`}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
