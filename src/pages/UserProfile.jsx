import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getCurrentUserProfile } from '../services/profileService';
import { analyzePersonality } from '../services/personalityAnalyzer';
import { supabase } from '../lib/supabase';

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [personalityAnalysis, setPersonalityAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editing states
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Saving states and messaging
  const [savingNames, setSavingNames] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setEmailInput(user.email);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      console.log('Loaded profile:', userProfile);

      if (!userProfile) {
        setProfile(null);
        setPersonalityAnalysis(null);
        return;
      }

      setProfile(userProfile);

      if (userProfile && (userProfile.analytical > 0 || userProfile.practical > 0)) {
        const analysis = analyzePersonality(userProfile);
        setPersonalityAnalysis(analysis);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
      setPersonalityAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  // Handlers - Names
  const startEditNames = () => {
    setFirstNameInput(profile?.firstName || '');
    setLastNameInput(profile?.lastName || '');
    setIsEditingNames(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const cancelEditNames = () => {
    setIsEditingNames(false);
    setFirstNameInput('');
    setLastNameInput('');
  };

  const saveNames = async () => {
    setSavingNames(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      if (!user?.id) throw new Error('No authenticated user.');
      const { error } = await supabase
        .from('profiles')
        .update({
          firstName: firstNameInput,
          lastName: lastNameInput,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccessMessage('Name updated successfully.');
      setIsEditingNames(false);
      await loadProfile();
    } catch (err) {
      console.error('Error updating names:', err);
      setErrorMessage(err?.message || 'Failed to update name.');
    } finally {
      setSavingNames(false);
    }
  };

  // Handlers - Email
  const startEditEmail = () => {
    setEmailInput(user?.email || '');
    setIsEditingEmail(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const cancelEditEmail = () => {
    setIsEditingEmail(false);
    setEmailInput(user?.email || '');
  };

  const saveEmail = async () => {
    setSavingEmail(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      if (!emailInput) throw new Error('Email cannot be empty.');
      if (emailInput === user?.email) {
        setIsEditingEmail(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ email: emailInput });

      if (error) throw error;

      setSuccessMessage('Email update requested. Please check your inbox to confirm the change.');
      setIsEditingEmail(false);
      // AuthContext listener should update user automatically on USER_UPDATED event
    } catch (err) {
      console.error('Error updating email:', err);
      setErrorMessage(err?.message || 'Failed to update email.');
    } finally {
      setSavingEmail(false);
    }
  };

  // Handlers - Password
  const startEditPassword = () => {
    setIsEditingPassword(true);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  const cancelEditPassword = () => {
    setIsEditingPassword(false);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  const savePassword = async () => {
    setSavingPassword(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      if (newPasswordInput.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      if (newPasswordInput !== confirmPasswordInput) {
        throw new Error('Passwords do not match.');
      }

      const { error } = await supabase.auth.updateUser({ password: newPasswordInput });

      if (error) throw error;

      setSuccessMessage('Password updated successfully.');
      cancelEditPassword();
    } catch (err) {
      console.error('Error updating password:', err);
      setErrorMessage(err?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      );
    }

    if (!profile || !personalityAnalysis) {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Profile not found
          </h2>
          <p className="text-gray-600 mb-4">
            We couldn't find a profile for this user. This may happen if:
          </p>
          <ul className="text-gray-600 text-left max-w-md mx-auto mb-6">
            <li>• You haven't completed onboarding</li>
            <li>• There's an issue with the database</li>
            <li>• Your session has expired</li>
          </ul>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            <button
              onClick={() => window.location.href = '/onboarding'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go to Onboarding
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full p-10">
        {/* Global messages */}
        {successMessage && (
          <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-700">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Header section within main content */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">
            Your personality and content preference profile
          </p>
        </div>

        {/* Profile Info - Editable first/last name + visible email */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Personal Information
            </h2>
            {!isEditingNames ? (
              <button
                onClick={startEditNames}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            ) : null}
          </div>

          {!isEditingNames ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">First Name</p>
                <p className="font-medium text-gray-900">{profile?.firstName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Name</p>
                <p className="font-medium text-gray-900">{profile?.lastName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Personality Type</p>
                <p className="font-medium text-gray-900">
                  {personalityAnalysis.personalityType}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={firstNameInput}
                    onChange={(e) => setFirstNameInput(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={lastNameInput}
                    onChange={(e) => setLastNameInput(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveNames}
                  disabled={savingNames}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingNames ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEditNames}
                  disabled={savingNames}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Settings - Email */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Account Email
            </h2>
            {!isEditingEmail ? (
              <button
                onClick={startEditEmail}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Email
              </button>
            ) : null}
          </div>

          {!isEditingEmail ? (
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">New Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter new email"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveEmail}
                  disabled={savingEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingEmail ? 'Saving...' : 'Save Email'}
                </button>
                <button
                  onClick={cancelEditEmail}
                  disabled={savingEmail}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Changing your email may require confirmation. Please check your inbox after saving.
              </p>
            </div>
          )}
        </div>

        {/* Account Settings - Password */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Password
            </h2>
            {!isEditingPassword ? (
              <button
                onClick={startEditPassword}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Password
              </button>
            ) : null}
          </div>

          {!isEditingPassword ? (
            <div>
              <p className="text-sm text-gray-600">
                For security reasons, your current password is not displayed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={savePassword}
                  disabled={savingPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingPassword ? 'Saving...' : 'Save Password'}
                </button>
                <button
                  onClick={cancelEditPassword}
                  disabled={savingPassword}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Personality Analysis */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Personality Analysis
          </h2>

          {/* Personality Dimensions */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Personality Dimensions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(personalityAnalysis.totals || {}).map(([dimension, score]) => (
                <div key={dimension} className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {dimension}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{score}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(score / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Key Characteristics
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Primary Type</p>
                  <p className="font-medium text-gray-900">
                    {personalityAnalysis.primaryType} ({personalityAnalysis.primaryScore} points)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Secondary Type</p>
                  <p className="font-medium text-gray-900">
                    {personalityAnalysis.secondaryType} ({personalityAnalysis.secondaryScore} points)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Content Preferences
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Tone</p>
                  <p className="font-medium text-gray-900">
                    {personalityAnalysis.tone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="font-medium text-gray-900">
                    {personalityAnalysis.postingFrequency} posts/week
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Pillars */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Content Pillars
          </h2>
          <p className="text-gray-600 mb-4">
            These are the main topics that will be generated for your content based on your personality:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalityAnalysis.contentPillars?.map((pillar, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: pillar.color }}
                />
                <div>
                  <p className="font-medium text-gray-900">{pillar.name}</p>
                  <p className="text-sm text-gray-600">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;