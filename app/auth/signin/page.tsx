'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const HIGHLIGHTS = [
  'AI placement assessment on first login',
  'Personalized learning roadmap generated for you',
  'Skill gap analysis against real job requirements',
  'Internship readiness score updated as you progress',
];

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const msg = params.get('message');
      const err = params.get('error');
      if (msg) { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 8000); }
      if (err) { setError(err); setTimeout(() => setError(''), 8000); }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError("That email and password combination doesn't match our records.");
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 bg-blue-600 flex-col justify-between p-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-black text-xs tracking-tight">AL</span>
          </div>
          <span className="text-white font-semibold text-base">AdaptiveLearn</span>
        </Link>

        {/* Main content */}
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-4">
            AI-Powered Internship Training
          </p>
          <h2 className="text-3xl font-bold text-white leading-snug mb-8">
            Build real skills.<br />Get hired faster.
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100 text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="border-t border-white/20 pt-6">
          <p className="text-blue-200 text-sm leading-relaxed italic">
            "Preparing the next generation of technology professionals through AI-powered learning."
          </p>
          <p className="text-blue-300 text-xs mt-2">— AdaptiveLearn Platform</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col bg-zinc-50">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-zinc-200">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-[10px]">AL</span>
            </div>
            <span className="font-semibold text-sm text-zinc-900">AdaptiveLearn</span>
          </Link>
          <div className="hidden lg:block" />

          <p className="text-sm text-zinc-500">
            No account?{' '}
            <Link href="/auth/signup" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">Welcome back</h1>
              <p className="text-sm text-zinc-500">Sign in to continue your learning journey</p>
            </div>

            {successMessage && (
              <div className="mb-5 flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</label>
                    <a href="#" className="text-xs text-zinc-400 hover:text-blue-600 transition-colors">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 pr-10 text-sm border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input id="remember" type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="remember" className="text-sm text-zinc-600 select-none cursor-pointer">Keep me signed in</label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </>
                  ) : 'Sign in'}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-zinc-100 text-center">
                <p className="text-sm text-zinc-500">
                  New to AdaptiveLearn?{' '}
                  <Link href="/auth/signup" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                    Create a free account
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-zinc-400">
              By signing in you agree to our{' '}
              <a href="#" className="hover:text-zinc-600 underline underline-offset-2 transition-colors">Terms</a>{' '}
              and{' '}
              <a href="#" className="hover:text-zinc-600 underline underline-offset-2 transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-8 py-4 border-t border-zinc-200 bg-white">
          <p className="text-xs text-zinc-400 text-center">© 2026 AdaptiveLearn. Built for the SALTEL community.</p>
        </div>
      </div>
    </div>
  );
}
