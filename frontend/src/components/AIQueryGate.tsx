"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Sparkles, Lock, AlertTriangle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Client-side blocked terms (basic protection - full list on server)
const BLOCKED_PATTERNS = [
  /ignore.*previous/i,
  /disregard.*above/i,
  /forget.*instructions/i,
  /you are now/i,
  /act as/i,
  /pretend/i,
  /system prompt/i,
  /reveal your/i,
  /sudo/i,
  /rm -rf/i,
  /drop table/i,
  /delete from/i,
];

function isBlockedQuery(query: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(query));
}

interface ExampleQuery {
  id: number;
  label: string;
  query: string;
  category: string;
}

interface AIQueryInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function AIQueryInput({ onSubmit, isLoading, placeholder }: AIQueryInputProps) {
  const [query, setQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [exampleQueries, setExampleQueries] = useState<ExampleQuery[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const email = localStorage.getItem("undervolt_email");
      setUserEmail(email);
    } catch {}
    loadExampleQueries();
  }, []);

  const loadExampleQueries = async () => {
    try {
      const { data } = await supabase
        .from("example_queries")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setExampleQueries(data);
    } catch (err) {
      console.error("Failed to load example queries");
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!query.trim()) return;
    
    // Check for blocked patterns
    if (isBlockedQuery(query)) {
      setError("This query contains restricted content. Please try a different question.");
      return;
    }
    
    if (!userEmail) {
      setShowSignup(true);
      return;
    }
    
    onSubmit(query);
    setQuery("");
  };

  const handleExampleClick = (exampleQuery: string) => {
    onSubmit(exampleQuery);
  };

  const isSignedIn = !!userEmail;

  return (
    <div className="space-y-4">
      {/* Example queries - free for everyone */}
      <div>
        <p className="text-white/40 text-xs mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example) => (
            <button
              key={example.id}
              onClick={() => handleExampleClick(example.query)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom query input */}
      <form onSubmit={handleCustomSubmit} className="relative">
        <div className={"relative " + (!isSignedIn ? "opacity-60" : "")}>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            placeholder={isSignedIn ? (placeholder || "Ask anything about Austin's energy infrastructure...") : "Sign up to ask custom questions..."}
            disabled={isLoading}
            className={"w-full px-4 py-3 pr-24 border rounded-xl text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50 " + 
              (isSignedIn 
                ? "bg-white/5 border-emerald-500/30 focus:border-emerald-500/50" 
                : "bg-white/[0.02] border-white/10 cursor-not-allowed")}
          />
          {!isSignedIn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Lock className="w-4 h-4 text-white/30 mr-2" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={"absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 " +
            (isSignedIn 
              ? "bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 text-black disabled:text-white/40" 
              : "bg-white/10 hover:bg-white/15 text-white/60")}
        >
          {!isSignedIn && <Lock className="w-3 h-3" />}
          {isLoading ? "..." : isSignedIn ? "Ask" : "Unlock"}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Powered by badge */}
      <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
        <Sparkles className="w-3 h-3" />
        <span>NVIDIA Nemotron Nano 8B • Persisted in Supabase</span>
      </div>

      {/* Signup modal */}
      <SignupModal 
        isOpen={showSignup} 
        onClose={() => setShowSignup(false)}
        onSignup={(email) => {
          setUserEmail(email);
          if (query.trim() && !isBlockedQuery(query)) {
            onSubmit(query);
            setQuery("");
          }
        }}
      />
    </div>
  );
}

// Export example queries for use elsewhere
export { type ExampleQuery };

// Signup modal component
function SignupModal({ 
  isOpen, 
  onClose, 
  onSignup 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSignup: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    try {
      await supabase.from("waitlist").upsert([{ 
        email: email.trim(), 
        source: "ai_custom_query" 
      }], { onConflict: "email" });
      
      localStorage.setItem("undervolt_email", email.trim());
      onSignup(email.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="text-xl font-semibold text-white">Unlock Custom Queries</h3>
        </div>
        <p className="text-white/60 text-sm mb-4">
          Sign up to ask your own questions about Austin's energy infrastructure, powered by local AI inference on NVIDIA Jetson.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50"
            required
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/60 transition-colors"
            >
              Use Examples
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Sign Up Free"}
            </button>
          </div>
        </form>
        
        <p className="text-white/30 text-xs mt-4 text-center">
          🔒 No data sent to cloud • Local inference only
        </p>
      </div>
    </div>
  );
}
