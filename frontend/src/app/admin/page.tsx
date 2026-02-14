"use client";

import { useState, useEffect } from "react";
import { Check, X, Loader2, RefreshCw, Users, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  approved: boolean;
  approved_at: string | null;
  created_at: string;
}

interface WaitlistEntry {
  id: number;
  email: string;
  reason: string | null;
  created_at: string;
}

// Admin check is done server-side via /api/admin/check

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if current user is admin
  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const res = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      const { isAdmin: admin } = await res.json();
      if (admin) {
        setIsAdmin(true);
        setAdminEmail(session.user.email);
        loadData();
      }
    }
    setChecking(false);
  };

  const loadData = async () => {
    setLoading(true);

    // Load users
    const { data: usersData } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Load waitlist
    const { data: waitlistData } = await supabase
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers(usersData || []);
    setWaitlist(waitlistData || []);
    setLoading(false);
  };

  const approveUser = async (userId: string) => {
    setActionLoading(userId);
    await supabase
      .from("user_profiles")
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        approved_by: adminEmail
      })
      .eq("id", userId);

    await loadData();
    setActionLoading(null);
  };

  const revokeUser = async (userId: string) => {
    setActionLoading(userId);
    await supabase
      .from("user_profiles")
      .update({ approved: false, approved_at: null, approved_by: null })
      .eq("id", userId);

    await loadData();
    setActionLoading(null);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      checkAdmin();
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16 px-4">
        <div className="max-w-sm w-full">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl font-semibold text-white">Admin Access</h1>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-white/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-white/30 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
              <p className="text-sm text-white/50">Manage users and waitlist</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:text-white hover:bg-white/15"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-2xl font-bold text-white">{users.length}</p>
            <p className="text-sm text-white/50">Total Users</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-2xl font-bold text-emerald-400">
              {users.filter(u => u.approved).length}
            </p>
            <p className="text-sm text-white/50">Approved</p>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-2xl font-bold text-amber-400">{waitlist.length}</p>
            <p className="text-sm text-white/50">Waitlist</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Users size={20} />
            Registered Users
          </h2>

          {users.length === 0 ? (
            <p className="text-white/50 text-center py-8">No users yet</p>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Signed Up</th>
                    <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Status</th>
                    <th className="text-right text-xs text-white/50 font-medium px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-white/5">
                      <td className="px-4 py-3 text-sm text-white">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.approved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                            <Check size={12} /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {actionLoading === user.id ? (
                          <Loader2 size={16} className="animate-spin text-white/50 ml-auto" />
                        ) : user.approved ? (
                          <button
                            onClick={() => revokeUser(user.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => approveUser(user.id)}
                            className="px-3 py-1 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-400"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Waitlist Table */}
        <div>
          <h2 className="text-lg font-medium text-white mb-4">Waitlist</h2>

          {waitlist.length === 0 ? (
            <p className="text-white/50 text-center py-8">No waitlist entries yet</p>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Reason</th>
                    <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((entry) => (
                    <tr key={entry.id} className="border-t border-white/5">
                      <td className="px-4 py-3 text-sm text-white">{entry.email}</td>
                      <td className="px-4 py-3 text-sm text-white/60 max-w-xs truncate">
                        {entry.reason || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
