'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { HumanNav } from '@/components/ui/human-nav';
import { HumanButton } from '@/components/ui/human-button';
import { HumanCard, HumanCardContent, HumanCardHeader, HumanCardTitle } from '@/components/ui/human-card';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HumanNav variant="landing" />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
              Personalized learning for everyone
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-gray-900 mb-6 leading-tight">
              Learn at your own pace,
              <br />
              <span className="font-semibold">with guidance that adapts</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              We believe learning should feel natural. Our platform understands how you learn 
              best and suggests the right content at the right time, helping you build skills 
              that actually stick.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              <Link href="/auth/signup">
                <HumanButton size="lg">
                  Start learning for free
                </HumanButton>
              </Link>
              <Link href="/auth/signin">
                <HumanButton variant="outline" size="lg">
                  I already have an account
                </HumanButton>
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                No credit card needed
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Free for students
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-normal text-gray-900 mb-4">
              Learning that feels <span className="font-semibold">natural</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No more one-size-fits-all courses. We adapt to how you learn best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HumanCard variant="warm" className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <HumanCardTitle className="mb-3">Smart recommendations</HumanCardTitle>
              <HumanCardContent>
                <p className="text-gray-600 text-sm">
                  We notice what you're good at and where you struggle, then suggest 
                  content that helps you improve without feeling overwhelmed.
                </p>
              </HumanCardContent>
            </HumanCard>

            <HumanCard variant="warm" className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <HumanCardTitle className="mb-3">Track your progress</HumanCardTitle>
              <HumanCardContent>
                <p className="text-gray-600 text-sm">
                  See how far you've come with simple, clear progress indicators. 
                  No confusing metrics—just honest feedback on your learning journey.
                </p>
              </HumanCardContent>
            </HumanCard>

            <HumanCard variant="warm" className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <HumanCardTitle className="mb-3">Quality content</HumanCardTitle>
              <HumanCardContent>
                <p className="text-gray-600 text-sm">
                  Learn from real experts who've been there. Our courses are practical, 
                  tested, and designed to help you build skills you'll actually use.
                </p>
              </HumanCardContent>
            </HumanCard>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-normal text-gray-900 mb-4">
              Built for <span className="font-semibold">real people</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're teaching, learning, or managing, we've got tools that just work.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <HumanCard variant="subtle" className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <HumanCardTitle className="mb-3">Students</HumanCardTitle>
              <HumanCardContent>
                <p className="text-gray-600 mb-4 text-sm">
                  Learn the way you want to. We adapt to your schedule, your pace, and your learning style.
                </p>
                <ul className="text-xs text-gray-500 space-y-2 text-left">
                  <li>• Personalized learning paths</li>
                  <li>• Progress that makes sense</li>
                  <li>• Learn when you want</li>
                </ul>
              </HumanCardContent>
            </HumanCard>

            <HumanCard variant="subtle" className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <HumanCardTitle className="mb-3">Instructors</HumanCardTitle>
              <HumanCardContent>
                <p className="text-gray-600 mb-4 text-sm">
                  Share what you know. We handle the boring stuff so you can focus on teaching.
                </p>
                <ul className="text-xs text-gray-500 space-y-2 text-left">
                  <li>• Easy course creation</li>
                  <li>• See how students are doing</li>
                  <li>• Get paid for your expertise</li>
                </ul>
              </HumanCardContent>
            </HumanCard>

            <HumanCard variant="subtle" className="text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <HumanCardTitle className="mb-3">Administrators</HumanCardTitle>
              <HumanCardContent>
                <p className="text-gray-600 mb-4 text-sm">
                  Keep everything running smoothly. Simple tools for managing people and content.
                </p>
                <ul className="text-xs text-gray-500 space-y-2 text-left">
                  <li>• User management</li>
                  <li>• Platform insights</li>
                  <li>• Course oversight</li>
                </ul>
              </HumanCardContent>
            </HumanCard>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section id="technology" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-normal text-gray-900 mb-4">
              What do you want to <span className="font-semibold">learn today?</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Practical skills for real-world problems.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Design', emoji: '🎨', description: 'Visual communication' },
              { name: 'Networking', emoji: '🌐', description: 'Connect systems together' },
              { name: 'Development', emoji: '💻', description: 'Build things that work' },
              { name: 'Business', emoji: '📊', description: 'Make things happen' },
            ].map((category, index) => (
              <HumanCard key={index} variant="organic" className="text-center hover:bg-white transition-colors cursor-pointer">
                <div className="text-3xl mb-3">{category.emoji}</div>
                <HumanCardTitle className="text-base mb-2">{category.name}</HumanCardTitle>
                <p className="text-xs text-gray-600">{category.description}</p>
              </HumanCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <HumanCard variant="warm" className="text-center">
            <div className="p-8">
              <h2 className="text-2xl font-normal text-gray-900 mb-4">
                Ready to start learning?
              </h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Join thousands of people who are already learning better with AdaptiveLearn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/signup">
                  <HumanButton>
                    Get started free
                  </HumanButton>
                </Link>
                <Link href="/auth/signin">
                  <HumanButton variant="outline">
                    Sign in
                  </HumanButton>
                </Link>
              </div>
            </div>
          </HumanCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">AL</span>
              </div>
              <span className="text-white font-medium">AdaptiveLearn</span>
            </div>
            <div className="text-center text-sm">
              <p>Made with care for the SALTEL community</p>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
