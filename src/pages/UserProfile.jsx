import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getCurrentUserProfile } from '../services/profileService';
import { analyzePersonality } from '../services/personalityAnalyzer';
import { supabase } from '../lib/supabase';
import { generatePersonalizedContent } from '../services/aiPersonalizationService';
import { formatDistanceToNow } from 'date-fns';

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [personalityAnalysis, setPersonalityAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [showAiStatus, setShowAiStatus] = useState(false);
  const [aiError, setAiError] = useState('');
  const autoTriggerRef = useRef(false);

  // Editing states
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [interestsInput, setInterestsInput] = useState('');

  // Saving states and messaging
  const [savingNames, setSavingNames] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const loadProfile = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handlers - Names
  const startEditNames = () => {
    setFirstNameInput(profile?.firstName || '');
    setLastNameInput(profile?.lastName || '');
    setIsEditingNames(true);

    setErrorMessage('');
  };

  const cancelEditNames = () => {
    setIsEditingNames(false);
    setFirstNameInput('');
    setLastNameInput('');
  };

  const saveNames = async () => {
    setSavingNames(true);

    setErrorMessage('');
    try {
      if (!user?.id) throw new Error('No authenticated user.');
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          firstName: firstNameInput,
          lastName: lastNameInput,
          updated_at: nowIso
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

  
      setIsEditingNames(false);
      await loadProfile();
    } catch (err) {
      console.error('Error updating names:', err);
      setErrorMessage(err?.message || 'Failed to update name.');
    } finally {
      setSavingNames(false);
    }
  };

  // Handlers - Password
  const startEditPassword = () => {
    setIsEditingPassword(true);
    setNewPasswordInput('');
    setConfirmPasswordInput('');

    setErrorMessage('');
  };

  const cancelEditPassword = () => {
    setIsEditingPassword(false);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  const savePassword = async () => {
    setSavingPassword(true);

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


      cancelEditPassword();
    } catch (err) {
      console.error('Error updating password:', err);
      setErrorMessage(err?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handlers - Interests
  const startEditInterests = () => {
    setInterestsInput(profile?.interest_text || '');
    setIsEditingInterests(true);

    setErrorMessage('');
  };

  const cancelEditInterests = () => {
    setIsEditingInterests(false);
    setInterestsInput('');
  };

  const saveInterests = async () => {
    setSavingInterests(true);

    setErrorMessage('');
    try {
      if (!user?.id) throw new Error('No authenticated user.');
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          interest_text: interestsInput,
          updated_at: nowIso,
          ai_regen_required: true,
          ai_prompt_fingerprint: null
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

 
      setIsEditingInterests(false);
      await loadProfile();
    } catch (err) {
      console.error('Error updating interests:', err);
      setErrorMessage(err?.message || 'Failed to update interests.');
    } finally {
      setSavingInterests(false);
    }
  };

  const handleGeneratePersonalization = useCallback(async (forceRegenerate = false) => {
    if (!user?.id) {
      setAiError('You must be signed in to generate personalized content.');
      return;
    }

    setAiGenerating(true);
    setAiError('');
    setShowAiStatus(false);
    setAiStatusMessage(forceRegenerate ? 'Regenerating personalized content...' : 'Generating personalized content...');

    try {
      const result = await generatePersonalizedContent({
        userId: user.id,
        forceRegenerate,
      });

      if (result.status === 'up-to-date') {
        setAiStatusMessage('Personalized content is already up to date.');
      } else {
        setAiStatusMessage('Personalized content updated successfully.');
      }
      setShowAiStatus(true);

      await loadProfile();
    } catch (err) {
      console.error('Error generating personalized content:', err);
      setAiError(err?.message || 'Failed to generate personalized content.');
      setAiStatusMessage('');
      setShowAiStatus(false);
    } finally {
      setAiGenerating(false);
    }
  }, [user?.id, loadProfile]);

  useEffect(() => {
    if (loading || !profile || !user?.id) return;

    const hasAiContent = Array.isArray(profile.content_pillars_ai) && profile.content_pillars_ai.length > 0;
    const requiresGeneration = !hasAiContent || profile.ai_regen_required;

    if (requiresGeneration && !autoTriggerRef.current && !aiGenerating) {
      autoTriggerRef.current = true;
      handleGeneratePersonalization(profile.ai_regen_required);
    }

    if (!requiresGeneration) {
      autoTriggerRef.current = false;
    }
  }, [loading, profile, user, aiGenerating, handleGeneratePersonalization]);

  useEffect(() => {
    if (!showAiStatus || !aiStatusMessage) return;

    const timer = setTimeout(() => {
      setShowAiStatus(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [showAiStatus, aiStatusMessage]);

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

    if (!profile) {
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

    if (!personalityAnalysis) {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Personality analysis unavailable
          </h2>
          <p className="text-gray-600 mb-4">
            Your core profile exists, but we were unable to generate the personality insights just yet.
          </p>
          <p className="text-gray-600">
            Try refreshing the page or re-running onboarding to regenerate your preferences.
          </p>
        </div>
      );
    }

    const interestDisplay = profile?.interest_text?.trim()
      ? profile.interest_text
      : personalityAnalysis.interests?.length
        ? personalityAnalysis.interests.join(', ')
        : 'No interests specified';

    const hasAiContent = Array.isArray(profile.content_pillars_ai) && profile.content_pillars_ai.length > 0;
    const aiGeneratedRelative = profile.ai_generated_at
      ? formatDistanceToNow(new Date(profile.ai_generated_at), { addSuffix: true })
      : null;
    const displayPillars = hasAiContent
      ? profile.content_pillars_ai
      : personalityAnalysis.contentPillars || [];
    const usingFallbackPillars = !hasAiContent && displayPillars.length > 0;
    const contentStrategy = hasAiContent ? profile.content_strategy_ai || {} : {};
    const contentMix = Array.isArray(contentStrategy?.contentMix) ? contentStrategy.contentMix : [];
    const callToActions = Array.isArray(contentStrategy?.callToActions) ? contentStrategy.callToActions : [];
    const keyMetrics = Array.isArray(contentStrategy?.keyMetrics) ? contentStrategy.keyMetrics : [];

    return (
      <div className="w-full p-10">
        {/* Global messages */}

      
        {errorMessage && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">
            {errorMessage}
          </div>
        )}

        {aiStatusMessage && showAiStatus && (
          <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-blue-700 flex items-start justify-between gap-4">
            <span>{aiStatusMessage}</span>
            <button
              onClick={() => setShowAiStatus(false)}
              className="text-blue-700 hover:text-blue-900"
              aria-label="Dismiss personalized content status"
            >
              ×
            </button>
          </div>
        )}

        {aiError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">
            {aiError}
          </div>
        )}

        {/* Header section within main content */}
        <div className="mb-8 flex flex-col items-start">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-left">
            My Profile
          </h1>
          <p className="text-gray-600 text-left">
            This is your personality and content preference profile. You can edit your name, email, and password here.
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
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Edit
              </button>
            ) : null}
          </div>

          {!isEditingNames ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">First Name</p>
                <p className="font-medium text-gray-900">{profile?.firstName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Name</p>
                <p className="font-medium text-gray-900">{profile?.lastName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email (cannot be changed)</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                {!isEditingPassword ? (
                  <button
                    onClick={startEditPassword}
                    className="px-3 py-1 text-sm text-orange-700 cursor-pointer"
                  >
                    Change Password
                  </button>
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
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
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
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
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

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                AI Personalized Content Strategy
              </h2>
              <p className="text-gray-600">
                Tailored pillars and publishing guidance based on your onboarding responses.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              {hasAiContent && aiGeneratedRelative && (
                <span className="text-sm text-gray-500">Updated {aiGeneratedRelative}</span>
              )}
              <button
                onClick={() => handleGeneratePersonalization(true)}
                disabled={aiGenerating}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {aiGenerating ? 'Generating...' : hasAiContent ? 'Regenerate' : 'Generate'}
              </button>
            </div>
          </div>

          {!hasAiContent ? (
            <div className="mt-6 rounded border border-dashed border-orange-300 bg-orange-50 p-5 text-left">
              <p className="text-gray-700 mb-4">
                We haven't generated personalized pillars yet. Kick off a run to tailor your content strategy with AI.
              </p>
              <button
                onClick={() => handleGeneratePersonalization(false)}
                disabled={aiGenerating}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {aiGenerating ? 'Generating...' : 'Generate Personalized Pillars'}
              </button>
              <p className="mt-3 text-sm text-gray-500">
                This uses your onboarding questionnaire, interests, and positioning statement to tailor your plan.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {profile.ai_persona_summary && (
                <div>
                  <h3 className="text-lg font-medium text-orange-600 mb-2">Persona Summary</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.ai_persona_summary}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Cadence</p>
                  <p className="text-gray-900 font-medium">
                    {contentStrategy?.cadence || 'See pillars below'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Call to Actions</p>
                  <ul className="text-sm text-gray-900 space-y-1">
                    {callToActions.length > 0 ? (
                      callToActions.map((cta, index) => (
                        <li key={index}>• {cta}</li>
                      ))
                    ) : (
                      <li>Encourage comments and shares.</li>
                    )}
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Key Metrics</p>
                  <ul className="text-sm text-gray-900 space-y-1">
                    {keyMetrics.length > 0 ? (
                      keyMetrics.map((metric, index) => (
                        <li key={index}>• {metric}</li>
                      ))
                    ) : (
                      <li>Track saves and reply rates.</li>
                    )}
                  </ul>
                </div>
              </div>

              {contentMix.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-orange-600 mb-3">Suggested Content Mix</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {contentMix.map((mix, index) => (
                      <div key={index} className="p-3 bg-white border border-gray-200 rounded">
                        <p className="font-medium text-gray-900">{mix.type}</p>
                        <p className="text-sm text-gray-600">{mix.percentage}% of your posts</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Personality Analysis */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-left">
            Personality Analysis
          </h2>

          {/* Personality Dimensions */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-orange-600 mb-3">
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
                      className="bg-orange-600 h-2 rounded-full"
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
              <h3 className="text-lg font-medium text-orange-400 mb-3">
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
              <h3 className="text-lg font-medium text-orange-400 mb-3">
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

          {/* Interests Section - Full Width */}
          <div className="mt-6 flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium text-orange-400 mb-3">
              Interests
            </h3>
            {!isEditingInterests ? (
              <div className="text-center max-w-2xl">
                <p className="text-gray-700 leading-relaxed mb-4">
                  {interestDisplay}
                </p>
                <button
                  onClick={startEditInterests}
                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Edit Interests
                </button>
              </div>
            ) : (
              <div className="text-center max-w-2xl w-full">
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                  rows="3"
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  placeholder="Enter your interests separated by commas"
                />
                <div className="flex justify-center gap-3">
                  <button
                    onClick={saveInterests}
                    disabled={savingInterests}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {savingInterests ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditInterests}
                    disabled={savingInterests}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  
                </div>
                <p className="text-xs text-gray-600 mt-3">Once saved, the content of your posts will be generated based on your new interests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Pillars */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-left">
            Content Pillars
          </h2>
          <p className="text-gray-600 mb-4 text-left">
            These are the main topics that will be generated for your content based on your personality.
          </p>
          {usingFallbackPillars && (
            <p className="text-sm text-orange-600 mb-4">
              Your personalized pillars are being generated. Showing baseline pillars for now.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayPillars?.map((pillar, index) => (
              <div key={index} className="p-4 bg-orange-50 rounded text-left space-y-2">
                <div>
                  <p className="font-medium text-gray-900 text-left">{pillar.name}</p>
                  <p className="text-sm text-gray-600">{pillar.description}</p>
                </div>
                {pillar.rationale && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Why it matters:</span> {pillar.rationale}
                  </p>
                )}
                {(pillar.tone || (pillar.postingIdeas && pillar.postingIdeas.length > 0)) && (
                  <div className="space-y-2">
                    {pillar.tone && (
                      <span className="inline-block px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                        Tone: {pillar.tone}
                      </span>
                    )}
                    {Array.isArray(pillar.postingIdeas) && pillar.postingIdeas.length > 0 && (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {pillar.postingIdeas.map((idea, ideaIndex) => (
                          <li key={ideaIndex}>• {idea}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
