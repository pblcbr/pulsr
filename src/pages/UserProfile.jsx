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
      // Cargar perfil real de la base de datos
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      
      // Analizar personalidad solo si hay datos del onboarding
      if (userProfile && userProfile.analytical > 0) {
        const analysis = analyzePersonality(userProfile);
        setPersonalityAnalysis(analysis);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile || !personalityAnalysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Error al cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mi Perfil
        </h1>
        <p className="text-gray-600">
          Tu perfil de personalidad y preferencias de contenido
        </p>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Información Personal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tipo de Personalidad</p>
            <p className="font-medium text-gray-900">
              {personalityAnalysis.personalityType}
            </p>
          </div>
        </div>
      </div>

      {/* Personality Analysis */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Análisis de Personalidad
        </h2>
        
        {/* Dimensiones de personalidad */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Dimensiones de Personalidad
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

        {/* Detalles del análisis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Características Principales
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Tipo Primario</p>
                <p className="font-medium text-gray-900">
                  {personalityAnalysis.primaryType} ({personalityAnalysis.primaryScore} puntos)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo Secundario</p>
                <p className="font-medium text-gray-900">
                  {personalityAnalysis.secondaryType} ({personalityAnalysis.secondaryScore} puntos)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Preferencias de Contenido
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Tono</p>
                <p className="font-medium text-gray-900">
                  {personalityAnalysis.tone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Frecuencia</p>
                <p className="font-medium text-gray-900">
                  {personalityAnalysis.postingFrequency} posts/semana
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Pillars */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pilares de Contenido
        </h2>
        <p className="text-gray-600 mb-4">
          Estos son los temas principales que se generarán para tu contenido basado en tu personalidad:
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
