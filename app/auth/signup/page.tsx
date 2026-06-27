'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BENEFITS = [
  'Free AI placement assessment on sign-up',
  'Personalized roadmap across 4 career tracks',
  'AI-generated quizzes after every module',
  'Real-time internship readiness score',
];

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (name.trim().length < 2) { setError('Name must be at least 2 characters.'); setIsLoading(false); return; }
    if (!email.includes('@') || !email.includes('.')) { setError('Please enter a valid email address.'); setIsLoading(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); setIsLoading(false); return; }
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        router.push(
          role === 'student'
            ? '/auth/signin?message=Account created! Sign in to start your placement assessment.'
            : '/auth/signin?message=Account created! You can now sign in.'
        );
      }
    } catch {
      setError('Unable to connect. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const strengthLevel =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 bg-blue-600 flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-black text-xs tracking-tight">AL</span>
          </div>
          <span className="text-white font-semibold text-base">AdaptiveLearn</span>
        </Link>

        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-4">
            Start your technology career
          </p>
          <h2 className="text-3xl font-bold text-white leading-snug mb-8">
            Everything you need<br />to get internship-ready.
          </h2>
          <ul className="space-y-4">
            {BENEFITS.map((item) => (
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

          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-blue-300 text-xs font-medium uppercase tracking-widest mb-3">Career tracks</p>
            <div className="flex flex-wrap gap-2">
              {['🌐 Networking', '📷 CCTV Systems', '⚙️ Embedded', '💻 Software Dev'].map((track) => (
                <span key={track} className="text-xs text-white bg-white/15 border border-white/20 px-3 py-1.5 rounded-full font-medium">
                  {track}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6">
          <p className="text-blue-200 text-sm leading-relaxed italic">
            "Join AdaptiveLearn and build the skills employers are looking for."
          </p>
          <p className="text-blue-300 text-xs mt-2">— Free forever. No credit card required.</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col bg-zinc-50">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-zinc-200">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-[10px]">AL</span>
            </div>
            <span className="font-semibold text-sm text-zinc-900">AdaptiveLearn</span>
          </Link>
          <div className="hidden lg:block" />

          <p className="text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">Create your account</h1>
              <p className="text-sm text-zinc-500">Free forever — no credit card required</p>
            </div>

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

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">Full name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">Email address</label>
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

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
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
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strengthLevel >= i ? strengthColors[strengthLevel] : 'bg-zinc-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-400 w-10">{strengthLabels[strengthLevel]}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { val: 'student', label: 'Student', sub: 'I want to learn' },
                      { val: 'instructor', label: 'Instructor', sub: 'I want to teach' },
                    ] as const).map(({ val, label, sub }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRole(val)}
                        className={`text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 ${
                          role === val
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${role === val ? 'text-blue-700' : 'text-zinc-700'}`}>{label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

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
                      Creating account…
                    </>
                  ) : 'Create account'}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-zinc-100 text-center">
                <p className="text-sm text-zinc-500">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-zinc-400">
              By signing up you agree to our{' '}
              <a href="#" className="hover:text-zinc-600 underline underline-offset-2 transition-colors">Terms</a>{' '}
              and{' '}
              <a href="#" className="hover:text-zinc-600 underline underline-offset-2 transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>

        <div className="px-8 py-4 border-t border-zinc-200 bg-white">
          <p className="text-xs text-zinc-400 text-center">© 2026 AdaptiveLearn. Built for the SALTEL community.</p>
        </div>
      </div>
    </div>
  );
}
