import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { Gem, Sparkles, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { COMPANY_DETAILS } from '../../config/company';

export const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('sukantahui');
  const [password, setPassword] = useState('Cnat@1977');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.auth.login({ email, password });
      login(res.token, res.user);
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Invalid username or password. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glowing gold ambient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-4">
            <Gem className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-cinzel tracking-wider flex items-center justify-center gap-2 uppercase">
            {COMPANY_DETAILS.name}
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-amber-400/90 font-mono tracking-widest mt-1 uppercase">
            {COMPANY_DETAILS.tagline}
          </p>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl gold-card-glow">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-100 font-cinzel">Employee Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your authorized staff credentials to open your terminal.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sukantahui"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating Terminal...</span>
              ) : (
                <>
                  <span>Sign In to POS Counter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">
              Quick Demo Fill:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('sukantahui', 'Cnat@1977')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-left transition-colors"
              >
                <div className="font-semibold text-amber-300">Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">sukantahui</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('owner@gmail.com', 'Cnat@1977')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-left transition-colors"
              >
                <div className="font-semibold text-amber-300">Owner</div>
                <div className="text-[10px] text-slate-400 font-mono">owner@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff', 'Cnat@1977')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-left transition-colors"
              >
                <div className="font-semibold text-emerald-400">Staff (Non-Admin)</div>
                <div className="text-[10px] text-slate-400 font-mono">staff</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('developer@gmail.com', 'Cnat@1977')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-left transition-colors"
              >
                <div className="font-semibold text-slate-300">Developer</div>
                <div className="text-[10px] text-slate-400 font-mono">developer</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Hallmark footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secured by Laravel Sanctum & BIS Hallmarking Protocol</span>
        </div>
      </div>
    </div>
  );
};
