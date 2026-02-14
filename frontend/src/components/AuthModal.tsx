"use client";

import { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = mode === 'signup'
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      if (mode === 'signup') {
        setSuccess(true);
      } else {
        onSuccess?.();
        onClose();
      }
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
          <p className="text-white/60 mb-6">
            We sent a confirmation link to <span className="text-white">{email}</span>
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-white mb-2">
          {mode === 'signup' ? 'Create an account' : 'Welcome back'}
        </h2>
        <p className="text-white/50 mb-6">
          {mode === 'signup'
            ? 'Sign up to ask custom questions and save your explorations'
            : 'Sign in to continue your exploration'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('signin')} className="text-white hover:underline">
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-white hover:underline">
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
