import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile } from '../services/profileService';
import { analyzePersonality } from '../services/personalityAnalyzer';

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [personalityAnalysis, setPersonalityAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Load real profile from database
      const userProfile = await getCurrentUserProfile();
      console.log('Loaded profile:', userProfile);
      
      if (!userProfile) {
        console.log('No profile found, user needs to complete onboarding');
        setProfile(null);
        setPersonalityAnalysis(null);
        return;
      }
      
      setProfile(userProfile);
      
      // Analyze personality only if there is onboarding data
      if (userProfile && (userProfile.analytical > 0 || userProfile.practical > 0)) {
        const analysis = analyzePersonality(userProfile);
        setPersonalityAnalysis(analysis);
        console.log('Personality analysis:', analysis);
      } else {
        console.log('Profile exists but no onboarding data yet');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
      setPersonalityAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

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
          No profile was found for your user. This can happen if:
        </p>
        <ul className="text-gray-600 text-left max-w-md mx-auto mb-6">
          <li>• You have not completed the onboarding</li>
          <li>• There is a problem with the database</li>
          <li>• Your session expired</li>
        </ul>
        <div className="space-x-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload page
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
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Profile
        </h1>
        <p className="text-gray-600">
          Your personality profile and content preferences
        </p>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {personalityAnalysis.positioning_statement && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-1">Positioning Statement</p>
              <p className="font-medium text-gray-900">
                {personalityAnalysis.positioning_statement}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Personality Analysis */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Personality Analysis
        </h2>
        
        {/* Personality dimensions */}
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

        {/* Analysis details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Main Characteristics
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

export default UserProfile;
