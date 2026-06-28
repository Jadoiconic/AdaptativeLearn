'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ResourceType =
  | 'video' | 'pdf' | 'documentation' | 'tutorial'
  | 'exercise' | 'lab' | 'project' | 'quiz' | 'external-link';

type ContributionType = 'resource' | 'project-idea' | 'discussion' | 'feedback' | 'report';

interface Resource {
  _id: string;
  title: string;
  description: string;
  type: ResourceType;
  url?: string;
  duration?: string;
  skillTags: string[];
  track?: string;
  roadmapPhase?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  verifiedByExpert: boolean;
  verifiedBy?: { name: string };
  votes: number;
  voterIds: string[];
  addedBy: { name: string; role: string };
  source: 'curated' | 'community' | 'ai-generated';
  _matchScore?: number;
}

interface Contribution {
  _id: string;
  userId: { name: string; avatar?: string; role: string };
  contributionType: ContributionType;
  title: string;
  content: string;
  url?: string;
  skillTags: string[];
  track?: string;
  votes: number;
  voterIds: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<ResourceType, { label: string; color: string; icon: string }> = {
  video:         { label: 'Video',        color: 'bg-red-100 text-red-700',    icon: '▶' },
  pdf:           { label: 'PDF',          color: 'bg-orange-100 text-orange-700', icon: '📄' },
  documentation: { label: 'Docs',         color: 'bg-blue-100 text-blue-700',  icon: '📖' },
  tutorial:      { label: 'Tutorial',     color: 'bg-indigo-100 text-indigo-700', icon: '🎓' },
  exercise:      { label: 'Exercise',     color: 'bg-green-100 text-green-700', icon: '💻' },
  lab:           { label: 'Lab',          color: 'bg-teal-100 text-teal-700',  icon: '🔬' },
  project:       { label: 'Project',      color: 'bg-purple-100 text-purple-700', icon: '🚀' },
  quiz:          { label: 'Quiz',         color: 'bg-yellow-100 text-yellow-700', icon: '✏️' },
  'external-link': { label: 'External',  color: 'bg-gray-100 text-gray-700',  icon: '🔗' },
};

const CONTRIBUTION_TYPE_META: Record<ContributionType, { label: string; color: string }> = {
  resource:     { label: 'Resource',     color: 'bg-blue-100 text-blue-700' },
  'project-idea': { label: 'Project Idea', color: 'bg-purple-100 text-purple-700' },
  discussion:   { label: 'Discussion',   color: 'bg-green-100 text-green-700' },
  feedback:     { label: 'Feedback',     color: 'bg-yellow-100 text-yellow-700' },
  report:       { label: 'Report Issue', color: 'bg-red-100 text-red-700' },
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-red-100 text-red-700',
};

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource, userId, onVote,
}: {
  resource: Resource;
  userId: string;
  onVote: (id: string) => void;
}) {
  const meta = TYPE_META[resource.type] ?? TYPE_META['external-link'];
  const voted = resource.voterIds.includes(userId);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
            {meta.icon} {meta.label}
          </span>
          {resource.verifiedByExpert && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Expert Verified
            </span>
          )}
          {resource.source === 'community' && (
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
              Community
            </span>
          )}
        </div>
        <button
          onClick={() => onVote(resource._id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            voted
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <svg className="w-3 h-3" fill={voted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          {resource.votes}
        </button>
      </div>

      {/* Title & description */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{resource.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{resource.description}</p>
      </div>

      {/* Skill tags */}
      {resource.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resource.skillTags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {tag}
            </span>
          ))}
          {resource.skillTags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
              +{resource.skillTags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          {resource.difficulty && (
            <span className={`px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[resource.difficulty]}`}>
              {resource.difficulty}
            </span>
          )}
          {resource.duration && <span>{resource.duration}</span>}
          {resource.roadmapPhase && <span>Phase {resource.roadmapPhase}</span>}
        </div>
        <span>by {resource.addedBy?.name ?? 'Instructor'}</span>
      </div>

      {/* CTA */}
      {resource.url ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Open Resource →
        </a>
      ) : (
        <button className="w-full text-center py-2 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg cursor-not-allowed">
          No link provided
        </button>
      )}
    </div>
  );
}

// ─── Contribution Card ────────────────────────────────────────────────────────

function ContributionCard({
  contribution, userId, onVote,
}: {
  contribution: Contribution;
  userId: string;
  onVote: (id: string) => void;
}) {
  const meta = CONTRIBUTION_TYPE_META[contribution.contributionType];
  const voted = contribution.voterIds.includes(userId);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
            {meta.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
            contribution.status === 'approved'
              ? 'bg-green-50 text-green-700 border-green-200'
              : contribution.status === 'pending'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {contribution.status}
          </span>
        </div>
        <button
          onClick={() => onVote(contribution._id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            voted
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <svg className="w-3 h-3" fill={voted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          {contribution.votes}
        </button>
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-1">{contribution.title}</h3>
      <p className="text-xs text-gray-500 mb-3 line-clamp-3">{contribution.content}</p>
      {contribution.url && (
        <a
          href={contribution.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          View link →
        </a>
      )}
      {contribution.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {contribution.skillTags.map((t) => (
            <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
          ))}
        </div>
      )}
      <div className="mt-3 text-xs text-gray-400 flex items-center justify-between">
        <span>{contribution.userId?.name}</span>
        <span>{new Date(contribution.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ─── Add Resource Form ────────────────────────────────────────────────────────

function AddResourceForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'video' as ResourceType,
    url: '', duration: '', difficulty: 'beginner',
    skillTagsStr: '', track: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skillTags: form.skillTagsStr.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add resource');
      setForm({ title: '', description: '', type: 'video', url: '', duration: '', difficulty: 'beginner', skillTagsStr: '', track: '' });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Add Curated Resource</h3>
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
          <input
            required value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. JavaScript Fundamentals — FreeCodeCamp"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
          <textarea
            required rows={2} value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of what this resource covers"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Type *</label>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ResourceType }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">URL</label>
          <input
            type="url" value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Duration</label>
          <input
            value={form.duration}
            onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 45 min, 3 hours"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Track</label>
          <select
            value={form.track}
            onChange={(e) => setForm((p) => ({ ...p, track: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All tracks</option>
            <option value="software-development">Software Development</option>
            <option value="networking">Networking</option>
            <option value="cctv">CCTV & Security</option>
            <option value="embedded-systems">Embedded Systems</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Skill Tags (comma-separated)</label>
          <input
            value={form.skillTagsStr}
            onChange={(e) => setForm((p) => ({ ...p, skillTagsStr: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. JavaScript, DOM Manipulation, ES6"
          />
        </div>
      </div>
      <button
        type="submit" disabled={submitting}
        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {submitting ? 'Adding...' : 'Add Resource'}
      </button>
    </form>
  );
}

// ─── Add Contribution Form ────────────────────────────────────────────────────

function AddContributionForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    contributionType: 'resource' as ContributionType,
    title: '', content: '', url: '', skillTagsStr: '', track: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/community/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skillTags: form.skillTagsStr.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setForm({ contributionType: 'resource', title: '', content: '', url: '', skillTagsStr: '', track: '' });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Share a Contribution</h3>
      <p className="text-xs text-gray-500">Contribute resources, project ideas, or feedback to the community. Submissions are reviewed before going live.</p>
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Type *</label>
          <select
            value={form.contributionType}
            onChange={(e) => setForm((p) => ({ ...p, contributionType: e.target.value as ContributionType }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(CONTRIBUTION_TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Track</label>
          <select
            value={form.track}
            onChange={(e) => setForm((p) => ({ ...p, track: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">General</option>
            <option value="software-development">Software Development</option>
            <option value="networking">Networking</option>
            <option value="cctv">CCTV & Security</option>
            <option value="embedded-systems">Embedded Systems</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
          <input
            required value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Title of your contribution"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
          <textarea
            required rows={3} value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your contribution, resource, or idea..."
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Link (optional)</label>
          <input
            type="url" value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Skill Tags (comma-separated)</label>
          <input
            value={form.skillTagsStr}
            onChange={(e) => setForm((p) => ({ ...p, skillTagsStr: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. React, Node.js"
          />
        </div>
      </div>
      <button
        type="submit" disabled={submitting}
        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Contribution'}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';
  const role = session?.user?.role ?? 'student';

  type Tab = 'recommended' | 'all' | 'community';
  const [activeTab, setActiveTab] = useState<Tab>('recommended');
  const [recommended, setRecommended] = useState<Resource[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [recMeta, setRecMeta] = useState<{ basedOnGaps: boolean; gapSkills: string[] } | null>(null);

  // Filters for "All Resources" tab
  const [filterType, setFilterType] = useState('');
  const [filterTrack, setFilterTrack] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterVerified, setFilterVerified] = useState(false);

  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);

  const loadRecommended = useCallback(async () => {
    const res = await fetch('/api/resources/recommended');
    if (res.ok) {
      const d = await res.json();
      setRecommended(d.resources ?? []);
      setRecMeta(d.meta ?? null);
    }
  }, []);

  const loadAll = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (filterTrack) params.set('track', filterTrack);
    if (filterDifficulty) params.set('difficulty', filterDifficulty);
    if (filterVerified) params.set('verified', 'true');
    const res = await fetch(`/api/resources?${params}`);
    if (res.ok) {
      const d = await res.json();
      setAllResources(d.resources ?? []);
    }
  }, [filterType, filterTrack, filterDifficulty, filterVerified]);

  const loadContributions = useCallback(async () => {
    const res = await fetch('/api/community/contributions');
    if (res.ok) {
      const d = await res.json();
      setContributions(d.contributions ?? []);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadRecommended(), loadAll(), loadContributions()]);
      setLoading(false);
    };
    init();
  }, [loadRecommended, loadAll, loadContributions]);

  useEffect(() => {
    if (!loading) loadAll();
  }, [filterType, filterTrack, filterDifficulty, filterVerified]);

  const handleResourceVote = async (id: string) => {
    const res = await fetch(`/api/resources/${id}/vote`, { method: 'POST' });
    if (res.ok) {
      const d = await res.json();
      const update = (r: Resource) => r._id === id ? { ...r, votes: d.votes, voterIds: d.voted ? [...r.voterIds, userId] : r.voterIds.filter(v => v !== userId) } : r;
      setRecommended((p) => p.map(update));
      setAllResources((p) => p.map(update));
    }
  };

  const handleContributionVote = async (id: string) => {
    const res = await fetch(`/api/community/contributions/${id}/vote`, { method: 'POST' });
    if (res.ok) {
      const d = await res.json();
      setContributions((p) =>
        p.map((c) => c._id === id ? { ...c, votes: d.votes, voterIds: d.voted ? [...c.voterIds, userId] : c.voterIds.filter(v => v !== userId) } : c)
      );
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'recommended', label: 'AI Matched', count: recommended.length },
    { id: 'all', label: 'Browse All', count: allResources.length },
    { id: 'community', label: 'Community', count: contributions.length },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-violet-200 text-sm font-semibold uppercase tracking-wide">Learning Resources</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Curated Learning Library</h1>
          <p className="text-violet-100 text-sm sm:text-base max-w-2xl">
            AI-matched resources aligned to your skill gaps, expert-validated content, and community contributions — all in one place.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" /> Expert verified
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-sm">
              <span className="w-2 h-2 bg-blue-300 rounded-full" /> AI-matched to your gaps
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-sm">
              <span className="w-2 h-2 bg-violet-300 rounded-full" /> Community supported
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute right-8 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Add buttons */}
        <div className="flex gap-2">
          {['instructor', 'admin'].includes(role) && (
            <button
              onClick={() => setShowAddResource(!showAddResource)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Resource
            </button>
          )}
          <button
            onClick={() => { setShowAddContribution(!showAddContribution); setActiveTab('community'); }}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Contribute
          </button>
        </div>
      </div>

      {/* Add Resource Form */}
      {showAddResource && ['instructor', 'admin'].includes(role) && (
        <AddResourceForm onSuccess={() => { setShowAddResource(false); loadAll(); loadRecommended(); }} />
      )}

      {/* ── AI MATCHED TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'recommended' && (
        <div className="space-y-4">
          {recMeta && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {recMeta.basedOnGaps
                    ? `AI matched ${recommended.length} resources to your skill gaps`
                    : `Showing top resources for your track`}
                </p>
                {recMeta.basedOnGaps && recMeta.gapSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recMeta.gapSkills.map((g) => (
                      <span key={g} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{g}</span>
                    ))}
                  </div>
                )}
                {!recMeta.basedOnGaps && (
                  <p className="text-xs text-blue-600 mt-1">
                    Run a <a href="/dashboard/ai-engine" className="underline font-medium">skill gap analysis</a> to get personalized resource recommendations.
                  </p>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-52 animate-pulse" />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700">No matched resources yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Instructors can add curated resources, or run a <a href="/dashboard/ai-engine" className="text-blue-600 underline">skill gap analysis</a> first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((r) => (
                <ResourceCard key={r._id} resource={r} userId={userId} onVote={handleResourceVote} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BROWSE ALL TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter:</span>
            <select
              value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All types</option>
              {Object.entries(TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={filterTrack} onChange={(e) => setFilterTrack(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All tracks</option>
              <option value="software-development">Software Dev</option>
              <option value="networking">Networking</option>
              <option value="cctv">CCTV & Security</option>
              <option value="embedded-systems">Embedded Systems</option>
            </select>
            <select
              value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox" checked={filterVerified}
                onChange={(e) => setFilterVerified(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              Expert verified only
            </label>
            {(filterType || filterTrack || filterDifficulty || filterVerified) && (
              <button
                onClick={() => { setFilterType(''); setFilterTrack(''); setFilterDifficulty(''); setFilterVerified(false); }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-52 animate-pulse" />)}
            </div>
          ) : allResources.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="font-semibold text-gray-700">No resources found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add the first resource.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allResources.map((r) => (
                <ResourceCard key={r._id} resource={r} userId={userId} onVote={handleResourceVote} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COMMUNITY TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'community' && (
        <div className="space-y-6">
          {/* Contribution form */}
          {showAddContribution && (
            <AddContributionForm onSuccess={() => { setShowAddContribution(false); loadContributions(); }} />
          )}
          {!showAddContribution && (
            <button
              onClick={() => setShowAddContribution(true)}
              className="w-full py-4 border-2 border-dashed border-violet-300 hover:border-violet-500 rounded-xl text-violet-600 hover:text-violet-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Share a resource, project idea, or feedback with the community
            </button>
          )}

          {/* Contributions grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />)}
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="font-semibold text-gray-700">No community contributions yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to share a resource or project idea!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contributions.map((c) => (
                <ContributionCard key={c._id} contribution={c} userId={userId} onVote={handleContributionVote} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
