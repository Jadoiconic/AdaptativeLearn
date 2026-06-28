'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadImagesToCloudinary } from '@/utils/uploadToCloudinary';

const COURSE_CATEGORIES = [
  'Networking',
  'CCTV Camera Systems',
  'Embedded Systems',
  'Software Development',
] as const;

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function CreateCoursePage() {
  useSession();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    duration: '',
    thumbnail: '',
    skillsCovered: [''],
    learningObjectives: [''],
    internshipReadinessOutcomes: [''],
    modules: [''],
    aiQuizEnabled: false,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, aiQuizEnabled: e.target.checked }));
  };

  type ArrayField = 'skillsCovered' | 'learningObjectives' | 'internshipReadinessOutcomes' | 'modules';

  const handleArrayChange = (field: ArrayField, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: ArrayField) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field: ArrayField, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();

    if (!formData.title.trim()) { alert('Please enter a course title'); return; }
    if (!formData.description.trim()) { alert('Please enter a course description'); return; }
    if (!formData.category) { alert('Please select a category'); return; }
    if (!formData.duration.trim()) { alert('Please enter an estimated duration'); return; }

    if (publish) {
      const validObjectives = formData.learningObjectives.filter(o => o.trim());
      if (validObjectives.length === 0) {
        alert('Please add at least one learning objective before publishing');
        return;
      }
    }

    setSubmitting(true);

    let thumbnailUrl = formData.thumbnail;
    if (thumbnailFile) {
      setUploadingThumbnail(true);
      try {
        const urls = await uploadImagesToCloudinary([thumbnailFile], {
          folder: 'adaptativelearn/courses/thumbnails',
        });
        thumbnailUrl = urls[0];
      } catch (err) {
        console.error('Thumbnail upload error:', err);
        alert('Failed to upload thumbnail. Please try again.');
        setUploadingThumbnail(false);
        setSubmitting(false);
        return;
      }
      setUploadingThumbnail(false);
    }

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          difficulty: formData.difficulty,
          duration: formData.duration,
          thumbnail: thumbnailUrl,
          skillsCovered: formData.skillsCovered.filter(s => s.trim()),
          learningObjectives: formData.learningObjectives.filter(o => o.trim()),
          internshipReadinessOutcomes: formData.internshipReadinessOutcomes.filter(o => o.trim()),
          modules: formData.modules.filter(m => m.trim()),
          aiQuizEnabled: formData.aiQuizEnabled,
          isPublished: publish,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create course');
      }

      window.location.href = '/dashboard/instructor';
    } catch (error) {
      console.error('Error creating course:', error);
      alert(error instanceof Error ? error.message : 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = submitting || uploadingThumbnail;

  const ArraySection = ({
    field,
    label,
    placeholder,
  }: {
    field: ArrayField;
    label: string;
    placeholder: (i: number) => string;
  }) => (
    <div className="space-y-3">
      {formData[field].map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder(index)}
          />
          {formData[field].length > 1 && (
            <button
              type="button"
              onClick={() => removeArrayItem(field, index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Remove"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addArrayItem(field)}
        className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors text-sm"
      >
        + Add {label}
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Training Course</h1>
        <p className="text-slate-600">Build an internship-ready training module for your learners</p>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-6">

          {/* Basic Information */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter course title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Course Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what trainees will learn and achieve in this course"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {COURSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Difficulty Level *
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estimated Duration *
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 8 weeks"
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Course Thumbnail
                </label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                {thumbnailPreview ? (
                  <div className="relative">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-48 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="bg-white text-slate-800 text-sm font-medium px-4 py-2 rounded-lg shadow hover:bg-slate-50"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <div className="text-center">
                      <p className="font-medium text-sm">Click to upload thumbnail</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP — recommended 1280×720</p>
                    </div>
                  </button>
                )}
                {thumbnailFile && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {thumbnailFile.name} — will upload on save
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills Covered */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Skills Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">List the specific skills trainees will gain from this course.</p>
              <ArraySection
                field="skillsCovered"
                label="Skill"
                placeholder={(i) => `Skill ${i + 1} (e.g., IP Subnetting)`}
              />
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Learning Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">What will trainees be able to do after completing this course?</p>
              <ArraySection
                field="learningObjectives"
                label="Objective"
                placeholder={(i) => `Objective ${i + 1}`}
              />
            </CardContent>
          </Card>

          {/* Internship Readiness Outcomes */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Internship Readiness Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">How does this course prepare trainees for real internship and employment environments?</p>
              <ArraySection
                field="internshipReadinessOutcomes"
                label="Outcome"
                placeholder={(i) => `Readiness outcome ${i + 1} (e.g., Can configure a Cisco switch in a live environment)`}
              />
            </CardContent>
          </Card>

          {/* Modules / Sections */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Course Modules / Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">Define the high-level sections of this course. You can add detailed content to each module after creation.</p>
              <ArraySection
                field="modules"
                label="Module"
                placeholder={(i) => `Module ${i + 1} title (e.g., Introduction to TCP/IP)`}
              />
            </CardContent>
          </Card>

          {/* AI & Publishing Options */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">AI & Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="aiQuizEnabled"
                  checked={formData.aiQuizEnabled}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="aiQuizEnabled" className="text-sm font-medium text-blue-900 cursor-pointer">
                    Enable AI Quiz Generation
                  </label>
                  <p className="text-xs text-blue-700 mt-1">
                    When enabled, AI will automatically generate recommended quizzes, skill tags, and internship readiness indicators for this course upon creation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pb-8">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={isLoading}
              className="px-6 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (uploadingThumbnail ? 'Uploading thumbnail…' : 'Publishing…') : 'Publish Course'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
