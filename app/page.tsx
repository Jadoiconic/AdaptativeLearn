'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── Data ─────────────────────────────────────────────────────────────────────

const COURSES = [
  {
    id: 'networking',
    accent: 'border-blue-500',
    dot: 'bg-blue-500',
    badge: 'text-blue-700 bg-blue-50 border-blue-200',
    title: 'Networking',
    sub: 'Cisco Fundamentals',
    description: 'Master TCP/IP, routing and switching, network security, and Cisco device configuration for enterprise environments.',
    duration: '12 weeks',
    level: 'Beginner → Advanced',
    skills: ['TCP/IP', 'Routing', 'Subnetting', 'Cisco IOS', 'Network Security'],
    roadmap: [
      'Networking Fundamentals',
      'IP Addressing & Subnetting',
      'Routing & Switching',
      'Network Security',
      'Cisco Device Configuration',
      'Troubleshooting Labs',
      'Internship Readiness',
    ],
  },
  {
    id: 'cctv',
    accent: 'border-zinc-500',
    dot: 'bg-zinc-500',
    badge: 'text-zinc-700 bg-zinc-50 border-zinc-200',
    title: 'CCTV Camera Systems',
    sub: 'Security & Surveillance',
    description: 'Learn camera installation, DVR/NVR configuration, IP surveillance systems and real-world security monitoring.',
    duration: '8 weeks',
    level: 'Beginner → Intermediate',
    skills: ['Camera Install', 'DVR/NVR', 'IP Cameras', 'Surveillance', 'Maintenance'],
    roadmap: [
      'Introduction to CCTV',
      'Camera Installation',
      'DVR/NVR Configuration',
      'IP Surveillance Systems',
      'Security Monitoring',
      'Troubleshooting',
      'Field Projects',
    ],
  },
  {
    id: 'embedded',
    accent: 'border-orange-500',
    dot: 'bg-orange-500',
    badge: 'text-orange-700 bg-orange-50 border-orange-200',
    title: 'Embedded Systems',
    sub: 'IoT & Microcontrollers',
    description: 'Build smart devices with Arduino, Raspberry Pi, sensor integration, and IoT fundamentals for modern tech industry roles.',
    duration: '10 weeks',
    level: 'Beginner → Advanced',
    skills: ['Arduino', 'Raspberry Pi', 'C/C++', 'Sensors', 'IoT', 'Automation'],
    roadmap: [
      'Electronics Basics',
      'Microcontrollers',
      'Arduino & Raspberry Pi',
      'Embedded Programming',
      'Sensors & Automation',
      'IoT Fundamentals',
      'Smart Systems Projects',
    ],
  },
  {
    id: 'software',
    accent: 'border-violet-500',
    dot: 'bg-violet-500',
    badge: 'text-violet-700 bg-violet-50 border-violet-200',
    title: 'Software Development',
    sub: 'Full Stack + AI',
    description: 'Go from HTML to full-stack applications with React, Next.js, backend APIs, databases and AI integration.',
    duration: '16 weeks',
    level: 'Beginner → Expert',
    skills: ['React', 'Next.js', 'Node.js', 'MongoDB', 'REST APIs', 'AI'],
    roadmap: [
      'HTML & CSS',
      'JavaScript',
      'React / Next.js',
      'Backend APIs',
      'Databases',
      'Authentication',
      'Full Stack Applications',
      'AI Integration',
    ],
  },
];

const AI_FEATURES = [
  {
    n: '01',
    title: 'Placement Assessment',
    desc: 'An adaptive AI quiz identifies your current skill level across your chosen track and assigns your optimal starting point.',
  },
  {
    n: '02',
    title: 'Personalized Roadmap',
    desc: 'AI generates a custom module sequence based on your goals, existing knowledge, and assessment results.',
  },
  {
    n: '03',
    title: 'Skill Gap Analysis',
    desc: 'See exactly which skills you are missing against real job descriptions, updated as you complete each module.',
  },
  {
    n: '04',
    title: 'AI-Generated Quizzes',
    desc: 'Every module ends with an AI-generated assessment that reinforces concepts and tracks knowledge retention over time.',
  },
  {
    n: '05',
    title: 'Readiness Scoring',
    desc: 'A live internship readiness score updates continuously, telling you precisely when you are employment-ready.',
  },
  {
    n: '06',
    title: 'Instructor Monitoring',
    desc: 'Instructors receive real-time analytics on each student, enabling early intervention before anyone falls behind.',
  },
];

const READINESS_STEPS = [
  { label: 'Learn', desc: 'Complete structured modules at your pace' },
  { label: 'Practise', desc: 'Apply skills through hands-on lab projects' },
  { label: 'Assess', desc: 'AI quizzes measure retention and gaps' },
  { label: 'Track', desc: 'Readiness score reflects real progress' },
  { label: 'Get Hired', desc: 'Enter the workforce internship-ready' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeRoadmap, setActiveRoadmap] = useState(0);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">

      {/* ── 1. Navigation ── */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-[10px] tracking-tight">AL</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">AdaptiveLearn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-500">
            <a href="#courses" className="hover:text-zinc-900 transition-colors">Courses</a>
            <a href="#roadmaps" className="hover:text-zinc-900 transition-colors">Roadmaps</a>
            <a href="#ai" className="hover:text-zinc-900 transition-colors">AI Features</a>
            <a href="#readiness" className="hover:text-zinc-900 transition-colors">Internship</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="hidden sm:block text-sm text-zinc-500 hover:text-zinc-900 px-3 py-1.5 transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Hero ── */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              AI-Powered Internship Training Platform
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
              Build real-world<br />technology skills<br />
              <span className="text-blue-600">with AI-powered learning.</span>
            </h1>
            <p className="text-base text-zinc-500 leading-relaxed mb-8 max-w-lg">
              Personalized internship training designed to prepare students for modern technology careers through structured roadmaps and intelligent skill development.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <Link href="/auth/signup" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors">
                Start learning
              </Link>
              <a href="#courses" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 px-6 py-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors">
                Explore courses
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm">
              {[['4', 'Career tracks'], ['AI', 'Powered learning'], ['Free', 'To get started']].map(([val, label]) => (
                <div key={label}>
                  <span className="font-bold text-zinc-900">{val}</span>
                  <span className="text-zinc-400 ml-1.5">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard preview */}
          <div className="hidden lg:block">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Mock top bar */}
              <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                </div>
                <span className="text-xs text-zinc-400 ml-2 font-mono">dashboard · learning progress</span>
              </div>

              <div className="p-5 space-y-4">
                {/* Readiness score */}
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Internship Readiness</p>
                    <p className="text-2xl font-bold text-zinc-900">74%</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">3 modules to complete</p>
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-blue-200 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#2563eb 74%, #dbeafe 0)' }} />
                    <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">74</span>
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2.5 uppercase tracking-wider">Current progress</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Routing & Switching', pct: 85, color: 'bg-blue-500' },
                      { label: 'Network Security', pct: 60, color: 'bg-violet-500' },
                      { label: 'Cisco Configuration', pct: 35, color: 'bg-orange-400' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-600">{item.label}</span>
                          <span className="text-zinc-400 tabular-nums">{item.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className={`h-1.5 ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI chip */}
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <span className="text-base leading-none mt-0.5">🤖</span>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-semibold">AI Tip:</span> Complete "Cisco Configuration" to unlock Internship Ready status.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Courses ── */}
      <section id="courses" className="py-20 px-6 border-t border-zinc-100 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Career Tracks</p>
            <h2 className="text-3xl font-bold tracking-tight">Four paths to employment.</h2>
            <p className="text-zinc-500 mt-2 max-w-xl">Industry-focused courses built around real job requirements. Each track ends with internship readiness.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {COURSES.map((course) => (
              <div key={course.id} className={`bg-white border-l-4 ${course.accent} border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200 flex flex-col`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base">{course.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{course.sub}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${course.badge}`}>
                    {course.duration}
                  </span>
                </div>

                <p className="text-sm text-zinc-500 leading-relaxed mb-4">{course.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {course.skills.map((s) => (
                    <span key={s} className="text-xs text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">{s}</span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100">
                  <span className="text-xs text-zinc-400">{course.level}</span>
                  <div className="flex items-center gap-3">
                    <a href="#roadmaps" onClick={() => setActiveRoadmap(COURSES.findIndex(c => c.id === course.id))} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                      View roadmap →
                    </a>
                    <Link href="/auth/signup" className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                      Start learning
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Roadmaps ── */}
      <section id="roadmaps" className="py-20 px-6 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Learning Journey</p>
            <h2 className="text-3xl font-bold tracking-tight">Structured roadmaps for every track.</h2>
            <p className="text-zinc-500 mt-2 max-w-xl">Every course follows a proven progression from fundamentals to employment readiness. Your AI roadmap adapts to your pace.</p>
          </div>

          {/* Desktop: 4-col grid. Mobile: tabbed */}
          <div className="hidden lg:grid grid-cols-4 gap-6">
            {COURSES.map((course) => (
              <div key={course.id} className="flex flex-col">
                <div className="mb-5">
                  <div className={`w-2 h-2 rounded-full ${course.dot} mb-2`} />
                  <h4 className="font-bold text-sm text-zinc-900">{course.title}</h4>
                  <p className="text-xs text-zinc-400">{course.duration}</p>
                </div>
                <div className="flex flex-col gap-0">
                  {course.roadmap.map((step, idx) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          idx === course.roadmap.length - 1
                            ? `border-blue-500 bg-blue-500`
                            : 'border-zinc-300 bg-white'
                        }`}>
                          {idx === course.roadmap.length - 1 ? (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          )}
                        </div>
                        {idx < course.roadmap.length - 1 && (
                          <div className="w-px h-7 bg-zinc-200 my-0.5" />
                        )}
                      </div>
                      <p className={`text-xs pt-0.5 pb-1 leading-relaxed ${
                        idx === course.roadmap.length - 1 ? 'font-semibold text-blue-600' : 'text-zinc-600'
                      }`}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: tabbed */}
          <div className="lg:hidden">
            <div className="flex flex-wrap gap-2 mb-8">
              {COURSES.map((course, i) => (
                <button
                  key={course.id}
                  onClick={() => setActiveRoadmap(i)}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                    activeRoadmap === i ? 'bg-blue-600 text-white' : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {course.title}
                </button>
              ))}
            </div>
            <div className="max-w-sm">
              {COURSES[activeRoadmap].roadmap.map((step, idx, arr) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      idx === arr.length - 1 ? 'border-blue-500 bg-blue-500' : 'border-zinc-300 bg-white'
                    }`}>
                      {idx === arr.length - 1 ? (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      )}
                    </div>
                    {idx < arr.length - 1 && <div className="w-px h-8 bg-zinc-200 my-0.5" />}
                  </div>
                  <p className={`text-sm pt-0.5 pb-2 ${idx === arr.length - 1 ? 'font-semibold text-blue-600' : 'text-zinc-600'}`}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. AI Learning Experience ── */}
      <section id="ai" className="py-20 px-6 border-t border-zinc-100 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Intelligence</p>
            <h2 className="text-3xl font-bold tracking-tight">Learning that adapts to you.</h2>
            <p className="text-zinc-500 mt-2 max-w-xl">The AI engine analyses your performance continuously, identifies gaps, and optimises your path — so you always know what to learn next and why.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 hover:shadow-sm transition-all duration-200">
                <span className="text-xs font-mono font-bold text-zinc-300 block mb-3">{f.n}</span>
                <h4 className="font-semibold text-zinc-900 text-sm mb-2">{f.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Internship Readiness ── */}
      <section id="readiness" className="py-20 px-6 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Internship Readiness</p>
            <h2 className="text-3xl font-bold tracking-tight">From student to employed.</h2>
            <p className="text-zinc-500 mt-2 max-w-xl">A clear, measurable progression from your first lesson to your first internship — tracked in real time by AI.</p>
          </div>

          {/* Desktop: horizontal steps */}
          <div className="hidden md:flex items-start gap-0">
            {READINESS_STEPS.map((step, idx) => (
              <div key={step.label} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-3 ${
                    idx === READINESS_STEPS.length - 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                  }`}>
                    {idx + 1}
                  </div>
                  <p className="font-semibold text-sm text-zinc-900 text-center mb-1">{step.label}</p>
                  <p className="text-xs text-zinc-400 text-center leading-relaxed px-2">{step.desc}</p>
                </div>
                {idx < READINESS_STEPS.length - 1 && (
                  <div className="flex-shrink-0 w-8 mt-5">
                    <div className="h-px w-full bg-zinc-200" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="md:hidden space-y-0">
            {READINESS_STEPS.map((step, idx) => (
              <div key={step.label} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    idx === READINESS_STEPS.length - 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < READINESS_STEPS.length - 1 && <div className="w-px h-8 bg-zinc-200 my-1" />}
                </div>
                <div className="pt-1.5 pb-4">
                  <p className="font-semibold text-sm text-zinc-900">{step.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { metric: '4', label: 'Technology career tracks', sub: 'Networking, CCTV, Embedded, Software' },
              { metric: 'AI', label: 'Powered every step', sub: 'Placement, roadmaps, quizzes, scoring' },
              { metric: '100%', label: 'Practical skills focus', sub: 'Real labs, real projects, real outcomes' },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                <p className="text-3xl font-bold text-blue-600 mb-1">{s.metric}</p>
                <p className="text-sm font-semibold text-zinc-900">{s.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CTA ── */}
      <section className="py-20 px-6 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Start building your technology career today.
          </h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            Take the free AI placement assessment and get your personalised learning roadmap in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/signup" className="w-full sm:w-auto text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors text-center">
              Get started free
            </Link>
            <a href="#courses" className="w-full sm:w-auto text-sm font-medium text-zinc-600 hover:text-zinc-900 px-6 py-3 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors text-center">
              Explore learning paths
            </a>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ── */}
      <footer className="border-t border-zinc-200 py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-black text-[10px]">AL</span>
                </div>
                <span className="font-semibold text-sm">AdaptiveLearn</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[180px]">
                AI-powered internship training for modern technology careers.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-3">Courses</p>
              <ul className="space-y-2">
                {COURSES.map((c) => (
                  <li key={c.id}>
                    <a href="#courses" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">{c.title}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-3">Platform</p>
              <ul className="space-y-2">
                {['AI Placement', 'Roadmaps', 'Progress Tracking', 'Certificates', 'Instructor Tools'].map((item) => (
                  <li key={item}>
                    <a href="#ai" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-3">Account</p>
              <ul className="space-y-2">
                <li><Link href="/auth/signin" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">Sign in</Link></li>
                <li><Link href="/auth/signup" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">Register free</Link></li>
                <li><a href="#" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-zinc-400">© 2026 AdaptiveLearn. Built for the SALTEL community.</p>
            <p className="text-xs text-zinc-400">AI-powered internship training platform.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
