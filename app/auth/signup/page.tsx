'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HumanButton } from '@/components/ui/human-button';
import { HumanCard, HumanCardContent, HumanCardHeader, HumanCardTitle } from '@/components/ui/human-card';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic client-side validation
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        // Success - redirect to sign in with success message
        router.push('/auth/signin?message=Account created successfully! You can now sign in.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
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
          <h1 className="text-xl font-medium text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-600 mt-1">Start your learning journey today</p>
        </div>

        <HumanCard variant="default">
          <HumanCardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border text-slate-700 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
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
                  className="w-full px-3 py-2 border text-slate-700 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border text-slate-700 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                      role === 'student'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Learn
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('instructor')}
                    className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                      role === 'instructor'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Teach
                  </button>
                </div>
              </div>

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
                {isLoading ? 'Creating account...' : 'Create account'}
              </HumanButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </HumanCardContent>
        </HumanCard>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">terms</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">privacy policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
