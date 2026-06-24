'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadImagesToCloudinary } from '@/utils/uploadToCloudinary';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_MB = 5;

interface EducationEntry {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: EducationEntry[];
  careerGoals?: string;
  createdAt?: string;
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== tag))}
              className="text-blue-500 hover:text-blue-900"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/me');
      if (!response.ok) throw new Error('Failed to load profile');
      const data = await response.json();
      setProfile(data.user);
      setProfileCompletion(data.profileCompletion ?? 0);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Profile picture must be a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }

    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const cancelPhotoChange = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const savePhoto = async () => {
    if (!photoFile) return;
    try {
      setUploadingPhoto(true);
      setError('');
      const [url] = await uploadImagesToCloudinary([photoFile], { folder: 'profile-pictures' });

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save profile picture');
      }

      const data = await response.json();
      setProfile(data.user);
      setProfileCompletion(data.profileCompletion ?? profileCompletion);
      cancelPhotoChange();
      await updateSession();
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setError('');
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          bio: profile.bio,
          skills: profile.skills,
          interests: profile.interests,
          education: profile.education,
          careerGoals: profile.careerGoals,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      const data = await response.json();
      setProfile(data.user);
      setProfileCompletion(data.profileCompletion ?? profileCompletion);
      setIsEditing(false);
      await updateSession();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordData.currentPassword) {
      alert('Current password is required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session?.user?.id,
          currentPassword: passwordData.currentPassword,
          password: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Password reset successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Failed to reset password');
    }
  };

  const updateEducationEntry = (index: number, field: keyof EducationEntry, value: string) => {
    if (!profile) return;
    const education = [...(profile.education || [])];
    education[index] = {
      ...education[index],
      [field]: field === 'startYear' || field === 'endYear' ? (value ? Number(value) : undefined) : value,
    };
    setProfile({ ...profile, education });
  };

  const addEducationEntry = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      education: [...(profile.education || []), { institution: '' }],
    });
  };

  const removeEducationEntry = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      education: (profile.education || []).filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700">Profile not found</div>
        </div>
      </div>
    );
  }

  const initials = profile.name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-blue-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-blue-100 text-base sm:text-lg">
              Manage your personal information and preferences
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Profile Completion */}
      <Card className="border-gray-200 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm font-semibold text-blue-700">{profileCompletion}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          {profileCompletion < 100 && (
            <p className="text-xs text-gray-500 mt-2">
              Complete your profile to receive more accurate AI-powered learning recommendations.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-200">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-gray-900">Personal Information</CardTitle>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? 'outline' : 'default'}
                className={isEditing ? '' : 'bg-blue-600 hover:bg-blue-700'}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{profile.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+250 700 000 000"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone || '—'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={3}
                      maxLength={1000}
                      className="w-full px-3 py-2 text-slate-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || '—'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Career Goals</label>
                  {isEditing ? (
                    <textarea
                      value={profile.careerGoals || ''}
                      onChange={(e) => setProfile({ ...profile, careerGoals: e.target.value })}
                      rows={3}
                      maxLength={1000}
                      placeholder="e.g. Become a frontend engineer at a product company within 12 months"
                      className="w-full px-3 py-2 text-slate-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{profile.careerGoals || '—'}</p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills & Interests */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Skills & Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <TagInput
                    label="Skills"
                    values={profile.skills || []}
                    onChange={(skills) => setProfile({ ...profile, skills })}
                    placeholder="Type a skill and press Enter"
                  />
                  <TagInput
                    label="Interests"
                    values={profile.interests || []}
                    onChange={(interests) => setProfile({ ...profile, interests })}
                    placeholder="Type an interest and press Enter"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.skills || []).length > 0 ? (
                        profile.skills!.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No skills added yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.interests || []).length > 0 ? (
                        profile.interests!.map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No interests added yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="border-gray-200">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-gray-900">Education</CardTitle>
              {isEditing && (
                <Button variant="outline" onClick={addEducationEntry}>
                  Add Entry
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {(profile.education || []).length === 0 && !isEditing && (
                <p className="text-sm text-gray-500">No education history added yet.</p>
              )}
              <div className="space-y-4">
                {(profile.education || []).map((entry, index) =>
                  isEditing ? (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-gray-200 rounded-lg">
                      <Input
                        placeholder="Institution"
                        value={entry.institution}
                        onChange={(e) => updateEducationEntry(index, 'institution', e.target.value)}
                      />
                      <Input
                        placeholder="Degree"
                        value={entry.degree || ''}
                        onChange={(e) => updateEducationEntry(index, 'degree', e.target.value)}
                      />
                      <Input
                        placeholder="Field of Study"
                        value={entry.fieldOfStudy || ''}
                        onChange={(e) => updateEducationEntry(index, 'fieldOfStudy', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Start Year"
                          value={entry.startYear ?? ''}
                          onChange={(e) => updateEducationEntry(index, 'startYear', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="End Year"
                          value={entry.endYear ?? ''}
                          onChange={(e) => updateEducationEntry(index, 'endYear', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => removeEducationEntry(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{entry.institution}</p>
                      <p className="text-sm text-gray-600">
                        {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(', ')}
                      </p>
                      {(entry.startYear || entry.endYear) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {entry.startYear || '—'} - {entry.endYear || 'Present'}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
              {isEditing && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {photoPreview || profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreview || profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-gray-500 font-semibold">{initials}</span>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <label className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                      />
                    </label>
                  </div>
                </div>

                {photoFile ? (
                  <div className="space-y-2">
                    <Button onClick={savePhoto} disabled={uploadingPhoto} className="w-full bg-blue-600 hover:bg-blue-700">
                      {uploadingPhoto ? 'Uploading...' : 'Save Photo'}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={cancelPhotoChange} disabled={uploadingPhoto}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                      Upload Photo
                    </Button>
                    <p className="text-xs text-gray-500">JPG, PNG or WebP (Max {MAX_IMAGE_SIZE_MB}MB)</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm text-gray-900">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <span className="text-sm text-gray-900 capitalize">{profile.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="pt-2">
                <Button variant="outline" className="w-full" onClick={() => setShowPasswordModal(true)}>
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handlePasswordReset} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
