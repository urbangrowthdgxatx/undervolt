"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export function WaitlistSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([{ email: email.trim(), source: "homepage" }]);

      if (error) {
        if (error.code === "23505") {
          setStatus("success");
          setMessage("You're already on the list!");
        } else {
          throw error;
        }
      } else {
        setStatus("success");
        setMessage("You're on the list!");
        setEmail("");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
        <span>✓</span>
        <span>{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        placeholder="Enter email for updates"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50 w-56"
        disabled={status === "loading"}
      />
      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-black text-sm font-medium rounded-full transition-colors"
      >
        {status === "loading" ? "..." : "Join Waitlist"}
      </button>
    </form>
  );
}
