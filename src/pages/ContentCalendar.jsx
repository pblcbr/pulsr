import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Cargar perfil mock (en producción vendría de la base de datos)
      setProfile(mockProfile);
      
      // Analizar personalidad para generar pilares
      const analysis = analyzePersonality(mockProfile);
      setPersonalityAnalysis(analysis);
      
      // Los pilares se generan automáticamente basados en la personalidad
      setPillars(analysis.contentPillars);
      
      // Inicialmente no hay contenido - se genera cuando el usuario lo solicite
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calendario de contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Calendario de Contenido
        </h1>
        <p className="text-gray-600">
          Gestiona tu contenido personalizado basado en tu perfil de personalidad
        </p>
      </div>

      {/* Content Pillars */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pilares de Contenido
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((pillar, index) => (
            <div key={index} className="flex items-center space-x-3">
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
  );
};

export default ContentCalendar;
