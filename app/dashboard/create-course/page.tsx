'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateCoursePage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    duration: '',
    price: '',
    thumbnail: '',
    objectives: [''],
    requirements: ['']
  });

  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'UI/UX Design',
    'Business',
    'Marketing',
    'Photography',
    'Music'
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field: 'objectives' | 'requirements', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'objectives' | 'requirements') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'objectives' | 'requirements', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.title.trim()) {
      alert('Please enter a course title');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Please enter a course description');
      return;
    }
    
    if (!formData.category) {
      alert('Please select a category');
      return;
    }
    
    if (!formData.duration.trim()) {
      alert('Please enter a duration');
      return;
    }
    
    if (publish) {
      const validObjectives = formData.objectives.filter(obj => obj.trim() !== '');
      if (validObjectives.length === 0) {
        alert('Please add at least one learning objective before publishing');
        return;
      }
    }
    
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          difficulty: formData.level,
          duration: formData.duration,
          price: formData.price ? parseFloat(formData.price) : 0,
          thumbnail: formData.thumbnail,
          objectives: formData.objectives.filter(obj => obj.trim() !== ''),
          requirements: formData.requirements.filter(req => req.trim() !== ''),
          isPublished: publish,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create course');
      }

      const result = await response.json();
      console.log('Course created successfully:', result);
      
      // Redirect to instructor dashboard or course details
      window.location.href = '/dashboard/instructor';
    } catch (error) {
      console.error('Error creating course:', error);
      alert(error instanceof Error ? error.message : 'Failed to create course');
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    handleSubmit(e, false);
  };

  const handlePublish = (e: React.FormEvent) => {
    handleSubmit(e, true);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Course</h1>
        <p className="text-slate-600">Share your knowledge and help others learn</p>
      </div>

      <form onSubmit={handleSubmit}>
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
                  placeholder="Describe what students will learn in this course"
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
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Level *
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {levels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duration *
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Learning Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                      className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Learning objective ${index + 1}`}
                    />
                    {formData.objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('objectives', index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  onClick={() => addArrayItem('objectives')}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                >
                  + Add Objective
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Course Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                      className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Requirement ${index + 1}`}
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('requirements', index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  onClick={() => addArrayItem('requirements')}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                >
                  + Add Requirement
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-6 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Publish Course
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
