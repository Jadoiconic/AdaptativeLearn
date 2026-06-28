'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { TRACK_REQUIRED_SKILLS, TRACK_LABELS, RecommendedTrack } from '@/lib/placement-tracks';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillGap {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedHours: number;
}

interface RoadmapPhase {
  phase: number;
  title: string;
  description: string;
  skills: string[];
  topics: string[];
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ReadinessScores {
  technicalSkills: number;
  practicalReadiness: number;
  internshipReadiness: number;
  overall: number;
}

interface SkillGapAnalysis {
  _id: string;
  track: string;
  inputSkills: string[];
  skillGaps: SkillGap[];
  masteredSkills: string[];
  roadmap: RoadmapPhase[];
  readinessScores: ReadinessScores;
  estimatedDuration: string;
  nextSteps: string[];
  aiNotes: string;
  generatedAt: string;
}

interface LiveReadiness {
  technicalSkills: number;
  practicalReadiness: number;
  internshipReadiness: number;
  overall: number;
}

interface UserProfile {
  selectedTrack?: RecommendedTrack;
  skills?: string[];
  placementAssessment?: {
    completed: boolean;
    score?: number;
    recommendedLevel?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

function scoreBgClass(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function priorityBadge(priority: 'high' | 'medium' | 'low') {
  const map = {
    high: 'bg-red-100 text-red-700 border border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    low: 'bg-green-100 text-green-700 border border-green-200',
  };
  return map[priority];
}

function difficultyBadge(d: string) {
  const map: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-purple-100 text-purple-700',
  };
  return map[d] ?? 'bg-gray-100 text-gray-700';
}

// ─── Circular progress gauge ──────────────────────────────────────────────────

function CircularGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{value}%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Workflow step pill ────────────────────────────────────────────────────────

function Step({
  num, label, done, active,
}: {
  num: number; label: string; done: boolean; active: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 flex-1 min-w-0`}>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
          ${done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
      >
        {done ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : num}
      </div>
      <span className={`text-xs font-medium text-center leading-tight ${active ? 'text-blue-700' : done ? 'text-green-700' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIEnginePage() {
  const { data: session } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [liveReadiness, setLiveReadiness] = useState<LiveReadiness | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = profile?.selectedTrack as RecommendedTrack | undefined;
  const requiredSkills = track ? (TRACK_REQUIRED_SKILLS[track] ?? []) : [];

  const loadData = useCallback(async () => {
    try {
      const [profileRes, analysisRes, readinessRes] = await Promise.all([
        fetch('/api/users/me'),
        fetch('/api/ai/skill-gap'),
        fetch('/api/ai/readiness'),
      ]);

      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d.user);
        if (d.user?.skills?.length > 0) {
          setSelectedSkills(new Set(d.user.skills));
        }
      }

      if (analysisRes.ok) {
        const d = await analysisRes.json();
        if (d.analysis) {
          setAnalysis(d.analysis);
          setSelectedSkills(new Set(d.analysis.inputSkills));
        }
      }

      if (readinessRes.ok) {
        const d = await readinessRes.json();
        if (d.readiness) setLiveReadiness(d.readiness);
      }
    } catch (err) {
      console.error('Error loading AI engine data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      next.has(skill) ? next.delete(skill) : next.add(skill);
      return next;
    });
  };

  const togglePhase = (phase: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(phase) ? next.delete(phase) : next.add(phase);
      return next;
    });
  };

  const runAnalysis = async () => {
    if (!profile?.placementAssessment?.completed) {
      setError('Please complete the placement assessment first.');
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSkills: Array.from(selectedSkills) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);

      // Refresh readiness scores
      const readinessRes = await fetch('/api/ai/readiness');
      if (readinessRes.ok) {
        const rd = await readinessRes.json();
        if (rd.readiness) setLiveReadiness(rd.readiness);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Workflow step state ────────────────────────────────────────────────────

  const stepDone = {
    1: true, // course selection always done if they're in dashboard
    2: !!(profile?.placementAssessment?.completed),
    3: selectedSkills.size > 0,
    4: !!analysis,
    5: !!(analysis?.roadmap?.length),
    6: !!(analysis?.readinessScores?.overall),
  };

  const activeStep = !stepDone[2] ? 2 : !stepDone[3] ? 3 : !stepDone[4] ? 4 : !stepDone[5] ? 5 : 6;

  // ─── Readiness scores to display (live > analysis fallback) ────────────────

  const readiness: ReadinessScores = liveReadiness ?? analysis?.readinessScores ?? {
    technicalSkills: 0, practicalReadiness: 0, internshipReadiness: 0, overall: 0,
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-36 bg-gray-200 rounded-2xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-gray-100 rounded-xl" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-blue-200 text-sm font-semibold uppercase tracking-wide">AI Learning Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Skill Gap Analysis & Learning Roadmap
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl">
            Identify your skill gaps, receive a personalized learning roadmap, and track your internship readiness — all powered by AI.
          </p>
          {track && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Track: {TRACK_LABELS[track]}
            </div>
          )}
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -right-4 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
      </div>

      {/* ── Workflow steps ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">AI Engine Workflow</h2>
        <div className="flex items-start gap-0">
          {[
            { num: 1, label: 'Course\nSelection' },
            { num: 2, label: 'Placement\nAssessment' },
            { num: 3, label: 'Skill\nInput' },
            { num: 4, label: 'Gap\nDetection' },
            { num: 5, label: 'Roadmap\nGeneration' },
            { num: 6, label: 'Readiness\nScore' },
          ].map((s, i, arr) => (
            <div key={s.num} className="flex items-center flex-1">
              <Step
                num={s.num}
                label={s.label}
                done={stepDone[s.num as keyof typeof stepDone]}
                active={activeStep === s.num}
              />
              {i < arr.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mt-[-20px] transition-colors ${stepDone[s.num as keyof typeof stepDone] ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Placement not done warning ──────────────────────────────────────── */}
      {!profile?.placementAssessment?.completed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Placement Assessment Required</h3>
            <p className="text-sm text-amber-700 mt-1">
              Complete your placement assessment first to unlock the full AI engine experience. The assessment calibrates the roadmap to your current level.
            </p>
            <a href="/placement-assessment" className="mt-3 inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
              Take Assessment
            </a>
          </div>
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — Skill Self-Assessment ──────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Skill Checklist */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Your Current Skills
              </h2>
              <p className="text-xs text-gray-500 mt-1">Select all skills you already know</p>
            </div>
            <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
              {requiredSkills.length === 0 ? (
                <p className="text-sm text-gray-500">No track selected. Please complete course selection.</p>
              ) : (
                requiredSkills.map((skill) => (
                  <label key={skill} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSkills.has(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{skill}</span>
                  </label>
                ))
              )}
            </div>
            <div className="p-5 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-3">
                {selectedSkills.size} of {requiredSkills.length} skills selected
              </div>
              {error && (
                <p className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded-lg">{error}</p>
              )}
              <button
                onClick={runAnalysis}
                disabled={analyzing || !profile?.placementAssessment?.completed}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {analysis ? 'Re-Analyze Skills' : 'Analyze My Skills'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Placement Summary */}
          {profile?.placementAssessment?.completed && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Placement Assessment</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {profile.placementAssessment.score ?? '--'}
                  </div>
                  <div className="text-xs text-gray-500">Score %</div>
                </div>
                <div className="flex-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                    profile.placementAssessment.recommendedLevel === 'beginner'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : profile.placementAssessment.recommendedLevel === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-purple-100 text-purple-700 border-purple-200'
                  }`}>
                    {profile.placementAssessment.recommendedLevel}
                  </span>
                  {profile.placementAssessment.strengths && profile.placementAssessment.strengths.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {profile.placementAssessment.strengths.slice(0, 2).map((s, i) => (
                        <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                          <span className="mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right columns — Results ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Employment Readiness Gauges */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Employment Readiness
              </h2>
              {liveReadiness && (
                <span className="text-xs text-gray-400">Live — updates with progress</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <CircularGauge value={readiness.technicalSkills} label="Technical Skills" color={scoreColor(readiness.technicalSkills)} />
              <CircularGauge value={readiness.practicalReadiness} label="Practical Readiness" color={scoreColor(readiness.practicalReadiness)} />
              <CircularGauge value={readiness.internshipReadiness} label="Internship Readiness" color={scoreColor(readiness.internshipReadiness)} />
              <CircularGauge value={readiness.overall} label="Overall Readiness" color={scoreColor(readiness.overall)} />
            </div>
            {!analysis && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Run a skill analysis to see personalized readiness scores
              </p>
            )}
          </div>

          {/* Skill Gap Visualization */}
          {analysis && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Skill Gap Map
                </h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Mastered ({analysis.masteredSkills.length})</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Gap ({analysis.skillGaps.length})</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {requiredSkills.map((skill) => {
                  const isMastered = analysis.masteredSkills.includes(skill);
                  const gap = analysis.skillGaps.find((g) => g.skill === skill);
                  return (
                    <div
                      key={skill}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isMastered
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {isMastered ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {skill}
                      {gap && (
                        <span className={`ml-1 px-1 py-0 rounded text-xs ${priorityBadge(gap.priority)}`}>
                          {gap.priority}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Skill gap breakdown table */}
              {analysis.skillGaps.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Skill Gap</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Est. Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analysis.skillGaps.map((gap, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{gap.skill}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityBadge(gap.priority)}`}>
                              {gap.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{gap.estimatedHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {analysis.skillGaps.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-green-800">All required skills mastered!</p>
                  <p className="text-sm text-gray-500 mt-1">Focus on advanced projects and portfolio building.</p>
                </div>
              )}
            </div>
          )}

          {/* AI Notes */}
          {analysis?.aiNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 text-sm">AI Insight</h3>
                <p className="text-sm text-blue-700 mt-1">{analysis.aiNotes}</p>
                {analysis.estimatedDuration && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Estimated completion: {analysis.estimatedDuration}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Personalized Roadmap ─────────────────────────────────────────────── */}
      {analysis?.roadmap && analysis.roadmap.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Personalized Learning Roadmap
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {analysis.roadmap.length} phases · {analysis.estimatedDuration} estimated
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {analysis.roadmap.map((phase) => {
              const allMastered = phase.skills.length > 0 && phase.skills.every((s) => analysis.masteredSkills.includes(s));
              const isOpen = expandedPhases.has(phase.phase);

              return (
                <div key={phase.phase}>
                  <button
                    onClick={() => togglePhase(phase.phase)}
                    className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      allMastered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {allMastered ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : phase.phase}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{phase.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${difficultyBadge(phase.difficulty)}`}>
                          {phase.difficulty}
                        </span>
                        {allMastered && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Ready to advance
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{phase.description}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400 hidden sm:block">{phase.estimatedDuration}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Skills covered */}
                        {phase.skills.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills Covered</h4>
                            <div className="flex flex-wrap gap-2">
                              {phase.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                    analysis.masteredSkills.includes(skill)
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  {analysis.masteredSkills.includes(skill) ? '✓ ' : ''}{skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Topics */}
                        {phase.topics.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Topics</h4>
                            <ul className="space-y-1">
                              {phase.topics.map((topic, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                  <span className="text-blue-400 mt-0.5 flex-shrink-0">›</span>
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-gray-500">Estimated: {phase.estimatedDuration}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AI Recommendations ───────────────────────────────────────────────── */}
      {analysis?.nextSteps && analysis.nextSteps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Recommendations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-blue-800">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!analysis && profile?.placementAssessment?.completed && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to analyze your skills</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Select your current skills from the checklist on the left, then click "Analyze My Skills" to generate your personalized roadmap and readiness scores.
          </p>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate My Roadmap
          </button>
        </div>
      )}

      {/* Footer info */}
      {analysis && (
        <p className="text-xs text-gray-400 text-center pb-4">
          Analysis generated {new Date(analysis.generatedAt).toLocaleString()} · Re-analyze anytime to update your roadmap
        </p>
      )}
    </div>
  );
}
