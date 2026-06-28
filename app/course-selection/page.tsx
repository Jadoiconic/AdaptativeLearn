'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { COURSE_OPTIONS, RecommendedTrack, CourseOption } from '@/lib/placement-tracks';

export default function CourseSelectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<RecommendedTrack | null>(null);
  const [hovered, setHovered] = useState<RecommendedTrack | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      // If placement already done, go to dashboard
      fetch('/api/users/me')
        .then((r) => r.json())
        .then((data) => {
          if (data.user?.placementAssessment?.completed) {
            router.push('/dashboard');
          } else {
            // Pre-select the previously chosen track if any
            if (data.user?.selectedTrack) {
              setSelected(data.user.selectedTrack as RecommendedTrack);
            }
            setChecking(false);
          }
        })
        .catch(() => setChecking(false));
    }
  }, [status, router]);

  const handleSelect = (track: RecommendedTrack) => {
    setSelected(track);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selected) {
      setError('Please select a course to continue.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/users/me/course-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: selected }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save selection. Please try again.');
        return;
      }

      router.push('/placement-assessment');
    } catch {
      setError('Unable to connect. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-200 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="pt-10 pb-6 px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-6 shadow-lg shadow-blue-600/30">
          <span className="text-white font-bold text-lg">AL</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
          Choose Your Learning Path
        </h1>
        <p className="text-blue-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Select the training course that aligns with your career goals. A personalized assessment and
          roadmap will be created just for you.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-blue-300">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
          <span className="text-blue-400">Course Selection</span>
          <span className="text-blue-600">→</span>
          <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 text-xs flex items-center justify-center font-bold">2</span>
          <span className="text-blue-500">Assessment</span>
          <span className="text-blue-600">→</span>
          <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 text-xs flex items-center justify-center font-bold">3</span>
          <span className="text-blue-500">Dashboard</span>
        </div>
      </div>

      {/* Course Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {COURSE_OPTIONS.map((course) => (
            <CourseCard
              key={course.track}
              course={course}
              isSelected={selected === course.track}
              isHovered={hovered === course.track}
              onSelect={() => handleSelect(course.track)}
              onMouseEnter={() => setHovered(course.track)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/40 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Confirm button */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={!selected || submitting}
            className={`px-10 py-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg ${
              selected && !submitting
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-105'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting
              ? 'Saving...'
              : selected
              ? `Continue with ${COURSE_OPTIONS.find((c) => c.track === selected)?.shortTitle} →`
              : 'Select a course to continue'}
          </button>
          <p className="text-blue-400 text-xs text-center max-w-sm">
            You can change your course selection on the next screen before starting the assessment.
          </p>
        </div>
      </div>
    </div>
  );
}

function CourseCard({
  course,
  isSelected,
  isHovered,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: {
  course: CourseOption;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const icons: Record<RecommendedTrack, React.ReactNode> = {
    networking: (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    cctv: (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
    'embedded-systems': (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    'software-development': (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  };

  const gradients: Record<RecommendedTrack, string> = {
    networking: 'from-blue-600 to-blue-800',
    cctv: 'from-slate-600 to-slate-900',
    'embedded-systems': 'from-emerald-600 to-emerald-800',
    'software-development': 'from-violet-600 to-violet-900',
  };

  const ringColors: Record<RecommendedTrack, string> = {
    networking: 'ring-blue-500',
    cctv: 'ring-slate-400',
    'embedded-systems': 'ring-emerald-500',
    'software-development': 'ring-violet-500',
  };

  const badgeColors: Record<RecommendedTrack, string> = {
    networking: 'bg-blue-900/60 text-blue-200',
    cctv: 'bg-slate-800/60 text-slate-300',
    'embedded-systems': 'bg-emerald-900/60 text-emerald-200',
    'software-development': 'bg-violet-900/60 text-violet-200',
  };

  const btnColors: Record<RecommendedTrack, string> = {
    networking: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30',
    cctv: 'bg-slate-600 hover:bg-slate-500 shadow-slate-600/30',
    'embedded-systems': 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
    'software-development': 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30',
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected
          ? `ring-2 ${ringColors[course.track]} border-transparent shadow-2xl scale-[1.02]`
          : 'border-slate-700/50 hover:border-slate-500/50 hover:shadow-xl hover:scale-[1.01]'
      }`}
    >
      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-10 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Colored header */}
      <div className={`bg-gradient-to-br ${gradients[course.track]} p-6 flex items-center gap-4`}>
        <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
          {icons[course.track]}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">{course.title}</h2>
          <div className="flex flex-wrap gap-1 mt-2">
            {course.careerPaths.slice(0, 2).map((path) => (
              <span key={path} className="px-2 py-0.5 bg-white/15 text-white/90 text-xs rounded-full font-medium">
                {path}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{course.description}</p>

        {/* Career paths */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Career Paths</h3>
          <ul className="space-y-1">
            {course.careerPaths.map((path) => (
              <li key={path} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                {path}
              </li>
            ))}
          </ul>
        </div>

        {/* Skills */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Skills You'll Gain</h3>
          <div className="flex flex-wrap gap-1.5">
            {course.skills.map((skill) => (
              <span key={skill} className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeColors[course.track]}`}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 shadow-lg ${
            isSelected ? 'bg-green-600 hover:bg-green-500 shadow-green-600/30' : btnColors[course.track]
          }`}
        >
          {isSelected ? '✓ Selected' : `Choose ${course.shortTitle}`}
        </button>
      </div>
    </div>
  );
}
