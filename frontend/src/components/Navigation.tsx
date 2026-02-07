"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Menu, X, User, LogOut, ChevronDown, Trophy } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    setUserEmail(localStorage.getItem("undervolt_email"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("undervolt_email");
    setUserEmail(null);
    setShowUserMenu(false);
    window.location.reload();
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Map" },
    { href: "/story", label: "Ask AI" },
    { href: "/reports", label: "Reports" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fbbf24" />
            </svg>
            <span className="text-white font-medium">Undervolt</span>
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm transition-colors ${
                    isActive ? "text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right - GitHub + User/SignIn */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com/urbangrowthdgxatx/undervolt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            
            {userEmail ? (
              /* User Menu - Right side */
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                    <span className="text-xs font-medium text-black">{userEmail[0].toUpperCase()}</span>
                  </div>
                  <ChevronDown size={14} className="text-white/50" />
                </button>
                
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs text-white/40 mb-1">Signed in as</p>
                        <p className="text-sm text-white font-medium truncate">{userEmail}</p>
                        <p className="text-xs text-amber-400 mt-1">Waitlist</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/60 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-white/5">
            <div className="px-6 py-4 space-y-4">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/5">
                {userEmail ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70 truncate">{userEmail}</span>
                    <button onClick={handleLogout} className="text-white/50 text-sm hover:text-white">Sign out</button>
                  </div>
                ) : (
                  <button onClick={() => { setShowSignIn(true); setMobileMenuOpen(false); }} className="text-white text-sm">Sign In</button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setShowSignIn(false)}>
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Join the Waitlist</h3>
              <p className="text-white/50 text-sm">
                Request access to custom AI queries
              </p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const email = (form.elements.namedItem("email") as HTMLInputElement).value;
              if (email) {
                try {
                  const { createClient } = await import("@supabase/supabase-js");
                  const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
                  );
                  await supabase.from("waitlist").upsert([{ email, source: "nav_signin" }], { onConflict: "email" });
                  // Notify admin
                  await fetch("/api/notify-signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, userId: "waitlist", reason: "Custom AI queries" })
                  });
                  // Show success - they are on waitlist, not signed in yet
                  const btn = form.querySelector("button[type=submit]") as HTMLButtonElement;
                  btn.textContent = "You are on the waitlist!";
                  btn.disabled = true;
                  setTimeout(() => setShowSignIn(false), 2000);
                } catch (err) {
                  console.error(err);
                }
              }
            }} className="space-y-3">
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-amber-500 text-black font-medium rounded-xl hover:bg-amber-400 transition-colors"
              >
                Join Waitlist
              </button>
              <button
                type="button"
                onClick={() => setShowSignIn(false)}
                className="w-full px-4 py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Cancel
              </button>
            </form>
            <p className="text-white/30 text-xs mt-4 text-center">We will notify you when approved</p>
          </div>
        </div>
      )}
    </>
  );
}
