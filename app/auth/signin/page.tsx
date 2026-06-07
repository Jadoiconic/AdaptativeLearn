'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HumanButton } from '@/components/ui/human-button';
import { HumanCard, HumanCardContent, HumanCardHeader, HumanCardTitle } from '@/components/ui/human-card';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('That email and password combination doesn\'t match our records');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Simple Brand */}
        <div className="text-center mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xs">AL</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-600 mt-1">Sign in to continue learning</p>
        </div>

        <HumanCard variant="default">
          <HumanCardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 text-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:text-slate-900 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="w-full px-3 py-2 border text-slate-700 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:text-slate-900 focus:border-transparent"
                />
              </div>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                  {successMessage}
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <HumanButton 
                type="submit" 
                className="w-full"
                loading={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </HumanButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                New to AdaptiveLearn?{' '}
                <Link 
                  href="/auth/signup" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </HumanCardContent>
        </HumanCard>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">terms</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">privacy policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
