'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { uploadVideosToCloudinary, uploadRawToCloudinary } from '@/utils/uploadToCloudinary';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Module {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  order: number;
  difficulty: string;
  type: string;
  objectives: string[];
  estimatedTime: string;
  skillsCovered: string[];
  aiQuizEnabled: boolean;
  internshipOutcome: string;
  videoUrl?: string;
  fileUrl?: string;
  isPublished: boolean;
}

interface Course {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
}

type FormTab = 'basic' | 'objectives' | 'skills' | 'content' | 'publishing';

const CONTENT_TYPES = [
  { value: 'lesson', label: 'Lesson', icon: '📖' },
  { value: 'video', label: 'Video Lesson', icon: '🎥' },
  { value: 'pdf', label: 'PDF Notes', icon: '📄' },
  { value: 'tutorial', label: 'Interactive Tutorial', icon: '💡' },
  { value: 'exercise', label: 'Practical Exercise', icon: '🔧' },
  { value: 'quiz', label: 'Quiz', icon: '✅' },
  { value: 'assignment', label: 'Assignment', icon: '📝' },
  { value: 'lab', label: 'Lab Session', icon: '🧪' },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-amber-100 text-amber-700' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-700' },
];

const initialForm = {
  title: '',
  description: '',
  objectives: [''],
  type: 'lesson',
  difficulty: 'beginner',
  estimatedTime: '',
  skillsCovered: [''],
  aiQuizEnabled: false,
  internshipOutcome: '',
  content: '',
  videoUrl: '',
  fileUrl: '',
  order: 1,
  isPublished: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeLabel(type: string) {
  return CONTENT_TYPES.find(t => t.value === type)?.label ?? type;
}
function typeIcon(type: string) {
  return CONTENT_TYPES.find(t => t.value === type)?.icon ?? '📖';
}
function difficultyColor(d: string) {
  return DIFFICULTY_LEVELS.find(l => l.value === d)?.color ?? 'bg-slate-100 text-slate-600';
}

function formProgress(f: typeof initialForm): number {
  const checks = [
    f.title.trim() !== '',
    f.description.trim() !== '',
    f.content.trim() !== '' || f.videoUrl !== '' || f.fileUrl !== '',
    f.estimatedTime.trim() !== '',
    f.objectives.some(o => o.trim() !== ''),
    f.skillsCovered.some(s => s.trim() !== ''),
    f.internshipOutcome.trim() !== '',
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// ─── Assessment modal types ───────────────────────────────────────────────────

interface AQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ModulesPage() {
  const { data: session } = useSession();

  // Data
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedCourseData, setSelectedCourseData] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  // Form panel
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formTab, setFormTab] = useState<FormTab>('basic');
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);
  const [quizTopics, setQuizTopics] = useState<string[]>([]);

  // Expanded module cards
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Drag and drop
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // File uploads
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Assessment modal
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentModule, setAssessmentModule] = useState<Module | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimit, setTimeLimit] = useState('');
  const [aQuestions, setAQuestions] = useState<AQuestion[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 },
  ]);

  // Draft save to localStorage
  const draftKey = `module-draft-${selectedCourse}`;
  const [hasDraft, setHasDraft] = useState(false);

  // ─── Data fetching ───────────────────────────────────────────────────────────

  useEffect(() => { fetchCourses(); }, [session?.user?.id]);

  useEffect(() => {
    if (selectedCourse) {
      fetchModules(selectedCourse);
      const d = courses.find(c => c._id === selectedCourse) ?? null;
      setSelectedCourseData(d);
      const saved = localStorage.getItem(draftKey);
      setHasDraft(!!saved);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const url = session?.user?.role === 'admin'
        ? '/api/courses'
        : `/api/courses?instructorId=${session?.user?.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
        if (data.courses.length > 0) setSelectedCourse(data.courses[0]._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (courseId: string) => {
    const res = await fetch(`/api/modules?courseId=${courseId}`);
    const data = await res.json();
    if (data.success) setModules(data.modules);
  };

  // ─── Form helpers ────────────────────────────────────────────────────────────

  const resetAI = () => {
    setAiError('');
    setAiGenerated(false);
    setQuizTopics([]);
  };

  const openCreateForm = () => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try { setFormData(JSON.parse(saved)); } catch { setFormData({ ...initialForm, order: modules.length + 1 }); }
    } else {
      setFormData({ ...initialForm, order: modules.length + 1 });
    }
    setEditingModule(null);
    setFormTab('basic');
    setVideoFile(null);
    setPdfFile(null);
    resetAI();
    setShowForm(true);
    setTimeout(() => document.getElementById('form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const openEditForm = (mod: Module) => {
    setFormData({
      title: mod.title,
      description: mod.description,
      objectives: mod.objectives?.length ? mod.objectives : [''],
      type: mod.type,
      difficulty: mod.difficulty,
      estimatedTime: mod.estimatedTime || '',
      skillsCovered: mod.skillsCovered?.length ? mod.skillsCovered : [''],
      aiQuizEnabled: mod.aiQuizEnabled || false,
      internshipOutcome: mod.internshipOutcome || '',
      content: mod.content,
      videoUrl: mod.videoUrl || '',
      fileUrl: mod.fileUrl || '',
      order: mod.order,
      isPublished: mod.isPublished,
    });
    setEditingModule(mod);
    setFormTab('basic');
    setVideoFile(null);
    setPdfFile(null);
    resetAI();
    setShowForm(true);
    setTimeout(() => document.getElementById('form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingModule(null);
    resetAI();
  };

  const saveDraft = useCallback(() => {
    localStorage.setItem(draftKey, JSON.stringify(formData));
    setHasDraft(true);
  }, [formData, draftKey]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
  };

  const setField = (key: keyof typeof initialForm, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  type ArrayField = 'objectives' | 'skillsCovered';
  const updateArray = (field: ArrayField, index: number, value: string) =>
    setFormData(prev => ({ ...prev, [field]: prev[field].map((v, i) => i === index ? value : v) }));
  const addArrayItem = (field: ArrayField) =>
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  const removeArrayItem = (field: ArrayField, index: number) =>
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  // ─── AI Generation ───────────────────────────────────────────────────────────

  const generateWithAI = async () => {
    if (!formData.title.trim()) {
      setAiError('Please enter a module title before generating content.');
      return;
    }
    if (!formData.description.trim()) {
      setAiError('Please enter a module description before generating content.');
      return;
    }

    setGeneratingAI(true);
    setAiError('');
    setAiGenerated(false);

    try {
      const res = await fetch('/api/ai/generate-module-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Unable to generate module content at the moment. Please check your API configuration or try again.');
      }

      const d = json.data;
      setFormData(prev => ({
        ...prev,
        objectives: d.learningObjectives?.length ? d.learningObjectives : prev.objectives,
        skillsCovered: d.skillsCovered?.length ? d.skillsCovered : prev.skillsCovered,
        internshipOutcome: d.internshipOutcomes?.length
          ? d.internshipOutcomes.join(' ')
          : prev.internshipOutcome,
        estimatedTime: d.estimatedTime || prev.estimatedTime,
        difficulty: d.difficulty || prev.difficulty,
      }));

      setQuizTopics(d.quizTopics ?? []);
      setAiGenerated(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to generate module content at the moment. Please try again.';
      setAiError(msg);
    } finally {
      setGeneratingAI(false);
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (publish?: boolean) => {
    if (!formData.title.trim()) { alert('Please enter a module title'); return; }
    if (!formData.description.trim()) { alert('Please enter a module description'); return; }
    if (!formData.content.trim() && !formData.videoUrl && !formData.fileUrl) {
      alert('Please add module content, a video, or a file'); return;
    }

    setSubmitting(true);
    try {
      const payload = {
        courseId: selectedCourse,
        title: formData.title,
        description: formData.description,
        content: formData.content || ' ',
        order: formData.order,
        difficulty: formData.difficulty,
        type: formData.type,
        objectives: formData.objectives.filter(o => o.trim()),
        estimatedTime: formData.estimatedTime,
        skillsCovered: formData.skillsCovered.filter(s => s.trim()),
        aiQuizEnabled: formData.aiQuizEnabled,
        internshipOutcome: formData.internshipOutcome,
        videoUrl: formData.videoUrl,
        fileUrl: formData.fileUrl,
        isPublished: publish !== undefined ? publish : formData.isPublished,
      };

      const url = '/api/modules';
      const method = editingModule ? 'PUT' : 'POST';
      const body = editingModule ? { ...payload, moduleId: editingModule._id } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      clearDraft();
      closeForm();
      fetchModules(selectedCourse);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save module');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Module actions ───────────────────────────────────────────────────────────

  const handleDelete = async (mod: Module) => {
    if (!confirm(`Delete "${mod.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/modules?moduleId=${mod._id}`, { method: 'DELETE' });
    if (res.ok) fetchModules(selectedCourse);
    else alert('Failed to delete module');
  };

  const handleDuplicate = async (mod: Module) => {
    const res = await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: selectedCourse,
        title: `${mod.title} (Copy)`,
        description: mod.description,
        content: mod.content,
        order: modules.length + 1,
        difficulty: mod.difficulty,
        type: mod.type,
        objectives: mod.objectives || [],
        estimatedTime: mod.estimatedTime || '',
        skillsCovered: mod.skillsCovered || [],
        aiQuizEnabled: mod.aiQuizEnabled || false,
        internshipOutcome: mod.internshipOutcome || '',
        videoUrl: mod.videoUrl || '',
        fileUrl: mod.fileUrl || '',
        isPublished: false,
      }),
    });
    if (res.ok) fetchModules(selectedCourse);
    else alert('Failed to duplicate module');
  };

  const toggleExpand = (id: string) =>
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ─── Drag and drop ───────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggingId) setDragOverId(id);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }

    const dragging = modules.find(m => m._id === draggingId);
    const target = modules.find(m => m._id === targetId);
    if (!dragging || !target) return;

    const reordered = modules.map(m => {
      if (m._id === draggingId) return { ...m, order: target.order };
      if (m._id === targetId) return { ...m, order: dragging.order };
      return m;
    }).sort((a, b) => a.order - b.order);

    setModules(reordered);
    setDraggingId(null);
    setDragOverId(null);

    await Promise.all([
      fetch('/api/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId: draggingId, order: target.order }) }),
      fetch('/api/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId: targetId, order: dragging.order }) }),
    ]);
  };

  // ─── File uploads ─────────────────────────────────────────────────────────────

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setUploadingVideo(true);
    setVideoProgress(0);
    try {
      const urls = await uploadVideosToCloudinary([file], { folder: 'adaptativelearn/modules/videos', onProgress: setVideoProgress });
      setField('videoUrl', urls[0]);
    } catch { alert('Video upload failed'); setVideoFile(null); }
    finally { setUploadingVideo(false); }
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setUploadingPdf(true);
    setPdfProgress(0);
    try {
      const urls = await uploadRawToCloudinary([file], { folder: 'adaptativelearn/modules/files', onProgress: setPdfProgress });
      setField('fileUrl', urls[0]);
    } catch { alert('File upload failed'); setPdfFile(null); }
    finally { setUploadingPdf(false); }
  };

  // ─── Assessment ───────────────────────────────────────────────────────────────

  const openAssessmentModal = (mod: Module) => {
    setAssessmentModule(mod);
    setAssessmentTitle(`${mod.title} Assessment`);
    setAssessmentDescription('');
    setPassingScore(60);
    setTimeLimit('');
    setAQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]);
    setShowAssessmentModal(true);
  };

  const handleCreateAssessment = async () => {
    if (!assessmentModule || !assessmentTitle) { alert('Title required'); return; }
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: assessmentModule._id,
        courseId: selectedCourse,
        title: assessmentTitle,
        description: assessmentDescription,
        questions: aQuestions,
        passingScore,
        timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
        isPublished: true,
      }),
    });
    if (res.ok) {
      setShowAssessmentModal(false);
      alert('Assessment created!');
    } else {
      alert('Failed to create assessment');
    }
  };

  const progress = formProgress(formData);

  // ─── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div><Skeleton className="h-9 w-64 mb-2" /><Skeleton className="h-5 w-96" /></div>
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1"><Skeleton className="h-5 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></div>
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const publishedCount = modules.filter(m => m.isPublished).length;
  const draftCount = modules.length - publishedCount;

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Module Management</h1>
            <p className="text-slate-500 text-sm">Build structured, AI-enhanced learning modules for your courses</p>
          </div>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Module
          </button>
        </div>
      </div>

      {/* ── Course Selector ── */}
      {courses.length > 0 ? (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Course</label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
              >
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            {/* Stats */}
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-700">{modules.length}</div>
                <div className="text-xs text-blue-600">Total</div>
              </div>
              <div className="text-center px-4 py-2 bg-emerald-50 rounded-lg">
                <div className="text-xl font-bold text-emerald-700">{publishedCount}</div>
                <div className="text-xs text-emerald-600">Published</div>
              </div>
              <div className="text-center px-4 py-2 bg-amber-50 rounded-lg">
                <div className="text-xl font-bold text-amber-700">{draftCount}</div>
                <div className="text-xs text-amber-600">Drafts</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
          No courses found. <a href="/dashboard/create-course" className="font-semibold underline">Create a course</a> first, then come back to add modules.
        </div>
      )}

      {/* ── Module Creation / Edit Form Panel ── */}
      {showForm && (
        <div id="form-panel" className="mb-6 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">

          {/* Form header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">
                {editingModule ? `Editing: ${editingModule.title}` : 'New Module'}
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">
                {editingModule ? 'Update module details below' : 'Fill in the details to create a new learning module'}
              </p>
            </div>
            <button onClick={closeForm} className="text-blue-200 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500">Form Completion</span>
              <span className={`text-xs font-bold ${progress === 100 ? 'text-emerald-600' : progress >= 60 ? 'text-blue-600' : 'text-slate-500'}`}>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : progress >= 60 ? 'bg-blue-500' : 'bg-slate-300'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-slate-100">
            <div className="flex gap-1">
              {([ ['basic', 'Basic Info'], ['objectives', 'Objectives'], ['skills', 'Skills & Outcomes'], ['content', 'Content'], ['publishing', 'AI & Publish'] ] as [FormTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setFormTab(tab)}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${formTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* AI assist banner */}
          {(formTab === 'objectives' || formTab === 'skills') && (
            <div className="mx-6 mt-4 space-y-3">
              <div className={`border rounded-xl p-4 transition-colors ${aiGenerated ? 'bg-emerald-50 border-emerald-200' : 'bg-gradient-to-r from-violet-50 to-blue-50 border-violet-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-violet-800">
                      {aiGenerated ? '✅ AI Content Generated' : '✨ AI Assistant'}
                    </p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      {aiGenerated
                        ? 'Fields have been auto-filled. Review and edit as needed, then regenerate if required.'
                        : 'Auto-fill learning objectives, skills, internship outcomes, time estimate, and difficulty from your title and description.'}
                    </p>
                    {generatingAI && (
                      <p className="text-xs text-violet-700 mt-1.5 flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                        Generating with AI — this may take a few seconds…
                      </p>
                    )}
                    {aiError && (
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 font-medium">Generation failed</p>
                        <p className="text-xs text-red-600 mt-0.5">{aiError}</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={generateWithAI}
                    disabled={generatingAI}
                    className={`shrink-0 px-4 py-2 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 ${aiGenerated ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                  >
                    {generatingAI ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Generating…</>
                    ) : aiGenerated ? '🔄 Regenerate' : '✨ Generate with AI'}
                  </button>
                </div>

                {/* Quiz topics result */}
                {aiGenerated && quizTopics.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700 mb-2">📋 Suggested Quiz Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quizTopics.map((topic, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 text-xs font-medium rounded-full shadow-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab content */}
          <div className="p-6 space-y-5">

            {/* ── Tab: Basic Info ── */}
            {formTab === 'basic' && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                  <strong>Tip:</strong> Fill in the title and description first, then switch to the <strong>Objectives</strong> or <strong>Skills & Outcomes</strong> tab to use AI generation.
                </div>

                <div>
                  <label className="label-style">Module Title <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setField('title', e.target.value)}
                    className="input-style"
                    placeholder="e.g., Introduction to IP Addressing"
                  />
                </div>

                <div>
                  <label className="label-style">Module Description <span className="text-red-400">*</span></label>
                  <textarea
                    value={formData.description}
                    onChange={e => setField('description', e.target.value)}
                    rows={3}
                    className="input-style"
                    placeholder="What will learners understand after completing this module? The more detail here, the better the AI generation."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label-style">Content Type</label>
                    <select value={formData.type} onChange={e => setField('type', e.target.value)} className="input-style">
                      {CONTENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-style">Difficulty Level</label>
                    <select value={formData.difficulty} onChange={e => setField('difficulty', e.target.value)} className="input-style">
                      {DIFFICULTY_LEVELS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-style">Estimated Time</label>
                    <input
                      type="text"
                      value={formData.estimatedTime}
                      onChange={e => setField('estimatedTime', e.target.value)}
                      className="input-style"
                      placeholder="e.g., 2 hours"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-style">Module Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setField('order', parseInt(e.target.value) || 1)}
                    min={1}
                    className="input-style w-32"
                  />
                </div>
              </>
            )}

            {/* ── Tab: Objectives ── */}
            {formTab === 'objectives' && (
              <div>
                <label className="label-style mb-3">Learning Objectives</label>
                <p className="text-xs text-slate-500 mb-3">What specific outcomes will learners achieve? Start each with an action verb.</p>
                <div className="space-y-2">
                  {formData.objectives.map((obj, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <input
                        type="text"
                        value={obj}
                        onChange={e => updateArray('objectives', i, e.target.value)}
                        className="flex-1 px-3 py-2 text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`Objective ${i + 1} (e.g., Configure a basic router)`}
                      />
                      {formData.objectives.length > 1 && (
                        <button type="button" onClick={() => removeArrayItem('objectives', i)} className="text-red-400 hover:text-red-600 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addArrayItem('objectives')} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Objective
                </button>
              </div>
            )}

            {/* ── Tab: Skills & Outcomes ── */}
            {formTab === 'skills' && (
              <>
                <div>
                  <label className="label-style mb-3">Skills Covered</label>
                  <p className="text-xs text-slate-500 mb-3">Specific technical or professional skills learners will develop.</p>
                  <div className="space-y-2">
                    {formData.skillsCovered.map((skill, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        <input
                          type="text"
                          value={skill}
                          onChange={e => updateArray('skillsCovered', i, e.target.value)}
                          className="flex-1 px-3 py-2 text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder={`Skill ${i + 1} (e.g., IP Subnetting)`}
                        />
                        {formData.skillsCovered.length > 1 && (
                          <button type="button" onClick={() => removeArrayItem('skillsCovered', i)} className="text-red-400 hover:text-red-600 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addArrayItem('skillsCovered')} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Skill
                  </button>
                </div>

                <div>
                  <label className="label-style">Internship Readiness Outcome</label>
                  <p className="text-xs text-slate-500 mb-2">How does this module prepare learners for real-world internship environments? (AI can generate multiple outcomes — they'll be combined here for editing.)</p>
                  <textarea
                    value={formData.internshipOutcome}
                    onChange={e => setField('internshipOutcome', e.target.value)}
                    rows={4}
                    className="input-style"
                    placeholder="e.g., Trainees will be able to configure and troubleshoot Cisco routers in a live internship environment…"
                  />
                </div>

                {/* Difficulty from AI */}
                {aiGenerated && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
                    <span className="text-xs font-semibold text-indigo-700">🎯 AI Difficulty Recommendation:</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${difficultyColor(formData.difficulty)}`}>
                      {formData.difficulty}
                    </span>
                    <span className="text-xs text-indigo-500">(applied to the Basic Info tab)</span>
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Content ── */}
            {formTab === 'content' && (
              <>
                <div>
                  <label className="label-style">Module Content <span className="text-red-400">*</span></label>
                  <p className="text-xs text-slate-500 mb-2">Full lesson text, notes, or instructions for this module.</p>
                  <textarea
                    value={formData.content}
                    onChange={e => setField('content', e.target.value)}
                    rows={10}
                    className="input-style font-mono text-sm leading-relaxed"
                    placeholder="Write the module content here…&#10;&#10;You can include:&#10;• Concepts and theory&#10;• Step-by-step instructions&#10;• Examples and exercises&#10;• References and links"
                  />
                </div>

                {/* Video Upload */}
                <div>
                  <label className="label-style">Video Lesson</label>
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                      {uploadingVideo ? `Uploading ${videoProgress}%…` : 'Upload Video'}
                    </button>
                    {formData.videoUrl && !uploadingVideo && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Video uploaded
                      </span>
                    )}
                    {videoFile && !uploadingVideo && <span className="text-xs text-slate-500 truncate max-w-xs">{videoFile.name}</span>}
                  </div>
                  {uploadingVideo && (
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden w-64">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                    </div>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <label className="label-style">Resource File (PDF, Document, Code)</label>
                  <input ref={pdfInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip,.py,.js,.ts,.html,.css" className="hidden" onChange={handlePdfChange} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={uploadingPdf}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {uploadingPdf ? `Uploading ${pdfProgress}%…` : 'Upload File'}
                    </button>
                    {formData.fileUrl && !uploadingPdf && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                        File uploaded
                      </span>
                    )}
                    {pdfFile && !uploadingPdf && <span className="text-xs text-slate-500 truncate max-w-xs">{pdfFile.name}</span>}
                  </div>
                  {uploadingPdf && (
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden w-64">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pdfProgress}%` }} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Tab: AI & Publish ── */}
            {formTab === 'publishing' && (
              <>
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="aiQuiz"
                      checked={formData.aiQuizEnabled}
                      onChange={e => setField('aiQuizEnabled', e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <div>
                      <label htmlFor="aiQuiz" className="text-sm font-semibold text-violet-900 cursor-pointer">
                        ✨ Enable AI Quiz Generation
                      </label>
                      <p className="text-xs text-violet-600 mt-1">
                        When enabled, the AI engine will automatically generate a quiz for this module to assess trainee knowledge. The quiz is created in the background after the module is saved.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Publishing</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleSubmit(false)}
                      disabled={submitting || uploadingVideo || uploadingPdf}
                      className="flex-1 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Saving…' : 'Save as Draft'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      disabled={submitting || uploadingVideo || uploadingPdf}
                      className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Publishing…' : 'Publish Module'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Form footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={saveDraft}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Save draft locally
              {hasDraft && <span className="ml-1 text-blue-500">●</span>}
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={submitting || uploadingVideo || uploadingPdf}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving…' : editingModule ? 'Update Module' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Module List ── */}
      <div className="space-y-3">
        {modules.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No modules yet</h3>
            <p className="text-slate-500 text-sm mb-5">Start building your course structure by creating your first learning module.</p>
            <button onClick={openCreateForm} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Create First Module
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 text-right">Drag modules to reorder</p>
            {modules.map((mod) => {
              const isExpanded = expandedModules.has(mod._id);
              const isDragging = draggingId === mod._id;
              const isDragOver = dragOverId === mod._id;

              return (
                <div
                  key={mod._id}
                  draggable
                  onDragStart={e => handleDragStart(e, mod._id)}
                  onDragOver={e => handleDragOver(e, mod._id)}
                  onDrop={e => handleDrop(e, mod._id)}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                  className={`bg-white border rounded-xl transition-all duration-200 shadow-sm ${isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'} ${isDragOver ? 'border-blue-400 border-2 shadow-md shadow-blue-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Drag handle */}
                    <div className="text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>

                    {/* Type icon */}
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {typeIcon(mod.type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">#{mod.order}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${mod.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {mod.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {typeLabel(mod.type)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${difficultyColor(mod.difficulty)}`}>
                          {mod.difficulty}
                        </span>
                        {mod.estimatedTime && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} /><polyline points="12 6 12 12 16 14" strokeWidth={2} strokeLinecap="round" /></svg>
                            {mod.estimatedTime}
                          </span>
                        )}
                        {mod.aiQuizEnabled && (
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">✨ AI Quiz</span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 truncate">{mod.title}</h3>
                      {!isExpanded && <p className="text-xs text-slate-500 truncate mt-0.5">{mod.description}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleExpand(mod._id)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button onClick={() => openEditForm(mod)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDuplicate(mod)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Duplicate">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button onClick={() => openAssessmentModal(mod)} className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Add Assessment">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      </button>
                      <button onClick={() => handleDelete(mod)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
                      <p className="text-sm text-slate-600">{mod.description}</p>

                      {mod.objectives?.filter(Boolean).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Learning Objectives</p>
                          <ul className="space-y-1">
                            {mod.objectives.filter(Boolean).map((obj, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {mod.skillsCovered?.filter(Boolean).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Skills Covered</p>
                          <div className="flex flex-wrap gap-1.5">
                            {mod.skillsCovered.filter(Boolean).map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {mod.internshipOutcome && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Internship Readiness</p>
                          <p className="text-sm text-emerald-800">{mod.internshipOutcome}</p>
                        </div>
                      )}

                      {(mod.videoUrl || mod.fileUrl) && (
                        <div className="flex gap-2 flex-wrap">
                          {mod.videoUrl && (
                            <a href={mod.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors">
                              🎥 Watch Video
                            </a>
                          )}
                          {mod.fileUrl && (
                            <a href={mod.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors">
                              📄 Download File
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Assessment Modal ── */}
      {showAssessmentModal && assessmentModule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">Create Assessment</h2>
                <p className="text-violet-100 text-xs mt-0.5">For: {assessmentModule.title}</p>
              </div>
              <button onClick={() => setShowAssessmentModal(false)} className="text-violet-200 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label-style">Assessment Title *</label>
                <input type="text" value={assessmentTitle} onChange={e => setAssessmentTitle(e.target.value)} className="input-style" placeholder="Assessment title" />
              </div>
              <div>
                <label className="label-style">Description</label>
                <textarea value={assessmentDescription} onChange={e => setAssessmentDescription(e.target.value)} rows={2} className="input-style" placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-style">Passing Score (%)</label>
                  <input type="number" value={passingScore} onChange={e => setPassingScore(+e.target.value)} min={0} max={100} className="input-style" />
                </div>
                <div>
                  <label className="label-style">Time Limit (minutes)</label>
                  <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} min={1} className="input-style" placeholder="No limit" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label-style !mb-0">Questions</label>
                  <button onClick={() => setAQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }])} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">+ Add Question</button>
                </div>
                <div className="space-y-4">
                  {aQuestions.map((q, qi) => (
                    <div key={qi} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-700">Question {qi + 1}</span>
                        {aQuestions.length > 1 && (
                          <button onClick={() => setAQuestions(prev => prev.filter((_, i) => i !== qi))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                        )}
                      </div>
                      <input type="text" value={q.question} onChange={e => setAQuestions(prev => prev.map((item, i) => i === qi ? { ...item, question: e.target.value } : item))} className="input-style mb-3" placeholder="Enter question" />
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input type="radio" name={`q${qi}`} checked={q.correctAnswer === oi} onChange={() => setAQuestions(prev => prev.map((item, i) => i === qi ? { ...item, correctAnswer: oi } : item))} className="text-blue-600" />
                            <input type="text" value={opt} onChange={e => setAQuestions(prev => prev.map((item, i) => i === qi ? { ...item, options: item.options.map((o, j) => j === oi ? e.target.value : o) } : item))} className="flex-1 px-3 py-1.5 text-sm text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={`Option ${oi + 1}`} />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Select the correct answer with the radio button</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAssessmentModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium">Cancel</button>
                <button onClick={handleCreateAssessment} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">Create Assessment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
