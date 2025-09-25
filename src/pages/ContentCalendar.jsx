import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CalendarGrid from '../components/calendar/CalendarGrid';
import { mockProfile } from '../data/mockProfile';
import { analyzePersonality } from '../services/personalityAnalyzer';
import { generatePersonalizedContent } from '../services/contentGenerator';

const ContentCalendar = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pillars, setPillars] = useState([]);
  const [content, setContent] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [personalityAnalysis, setPersonalityAnalysis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load mock profile (in production this would come from the database)
      setProfile(mockProfile);
      
      // Analyze personality to generate pillars
      const analysis = analyzePersonality(mockProfile);
      setPersonalityAnalysis(analysis);
      
      // Pillars are automatically generated based on personality
      setPillars(analysis.contentPillars);
      
      // Initially no content - it is generated when the user requests it
      setContent([]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleGenerateContent = async () => {
    if (!profile || !pillars.length) return;
    
    setIsGenerating(true);
    try {
      const result = await generatePersonalizedContent(profile, pillars, {
        days: 30,
        includeWeekends: true,
        postingFrequency: 'auto'
      });
      
      if (result.success) {
        setContent(result.content);
        setPersonalityAnalysis(result.personalityAnalysis);
      } else {
        console.error('Error generating content:', result.error);
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  if (!profile) {
    return (
      <div className="w-full">
        {/* Header */}
        <Header />
        
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading content calendar...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1">
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Content Calendar
              </h1>
              <p className="text-gray-600">
                Manage your personalized content based on your personality profile
              </p>
            </div>

     

            {/* Calendar */}
            <div className="bg-white rounded-lg shadow">
              <CalendarGrid
                content={content}
                pillars={pillars}
                onDateClick={handleDateClick}
                onGenerateContent={handleGenerateContent}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContentCalendar;
