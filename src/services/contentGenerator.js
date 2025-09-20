// Generador de contenido que integra personalidad, pilares y OpenAI
import { analyzePersonality } from './personalityAnalyzer';
import { generateContent, generateCalendarContent } from './openai';
// Ya no necesitamos importar generateMockContent

/**
 * Genera contenido personalizado basado en el perfil del usuario
 * @param {Object} profile - Perfil del usuario con datos de personalidad
 * @param {Array} pillars - Pilares de contenido del usuario
 * @param {Object} options - Opciones de generación
 * @returns {Promise<Object>} Resultado de la generación
 */
export const generatePersonalizedContent = async (profile, pillars, options = {}) => {
  try {
    // Analizar personalidad del usuario
    const personalityAnalysis = analyzePersonality(profile);
    
    // Configurar opciones por defecto
  const {
    days = 30,
    includeWeekends = true,
    postingFrequency = 'auto'
  } = options;

    // Determinar frecuencia de posting
    const frequency = postingFrequency === 'auto' 
      ? personalityAnalysis.postingFrequency 
      : postingFrequency;

    // Generar fechas de posting
    const postingDates = generatePostingDates(days, frequency, includeWeekends);
    
    let content = [];

    // Siempre usar OpenAI para generar contenido
    content = await generateCalendarContent(personalityAnalysis, pillars, days);

    // Asignar fechas de posting
    content = assignPostingDates(content, postingDates);

    return {
      success: true,
      content,
      personalityAnalysis,
      pillars,
      stats: {
        totalPosts: content.length,
        daysCovered: days,
        averagePostsPerDay: (content.length / days).toFixed(1),
        pillarsUsed: [...new Set(content.map(post => post.pillar_id))].length
      }
    };
  } catch (error) {
    console.error('Error generating personalized content:', error);
    return {
      success: false,
      error: error.message,
      content: [],
      personalityAnalysis: null,
      pillars: [],
      stats: null
    };
  }
};

/**
 * Genera fechas de posting basadas en la frecuencia y preferencias
 */
const generatePostingDates = (days, frequency, includeWeekends) => {
  const dates = [];
  const startDate = new Date();
  
  // Parsear frecuencia
  let postsPerDay;
  if (typeof frequency === 'string' && frequency.includes('-')) {
    const [min, max] = frequency.split('-').map(Number);
    postsPerDay = Math.floor(Math.random() * (max - min + 1)) + min;
  } else {
    postsPerDay = parseInt(frequency) || 1;
  }

  // Horarios óptimos por día de la semana
  const optimalTimes = {
    monday: ['09:00', '14:00', '16:00'],
    tuesday: ['09:00', '14:00', '16:00'],
    wednesday: ['09:00', '14:00', '16:00'],
    thursday: ['09:00', '14:00', '16:00'],
    friday: ['09:00', '14:00', '16:00'],
    saturday: ['10:00', '15:00', '19:00'],
    sunday: ['10:00', '15:00', '19:00']
  };

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Saltar fines de semana si no se incluyen
    if (!includeWeekends && (dayName === 'saturday' || dayName === 'day')) {
      continue;
    }

    // Generar horarios para este día
    const times = optimalTimes[dayName] || optimalTimes.monday;
    const selectedTimes = times.slice(0, postsPerDay);
    
    selectedTimes.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const postingDate = new Date(date);
      postingDate.setHours(hours, minutes, 0, 0);
      dates.push(postingDate);
    });
  }

  return dates;
};

/**
 * Asigna fechas de posting al contenido generado
 */
const assignPostingDates = (content, postingDates) => {
  return content.map((post, index) => {
    const postingDate = postingDates[index] || new Date();
    return {
      ...post,
      scheduled_at: postingDate.toISOString(),
      status: 'scheduled'
    };
  });
};

/**
 * Genera un solo post basado en un pilar específico
 */
export const generateSinglePost = async (profile, pillar, scheduledDate) => {
  try {
    const personalityAnalysis = analyzePersonality(profile);
    const content = await generateContent(personalityAnalysis, pillar, scheduledDate);
    
    return {
      success: true,
      content: {
        id: `single-${Date.now()}`,
        user_id: profile.user_id,
        profile_id: profile.id,
        type: 'tweet',
        channel: 'Twitter',
        pillar_id: pillar.id,
        ...content
      }
    };
  } catch (error) {
    console.error('Error generating single post:', error);
    return {
      success: false,
      error: error.message,
      content: null
    };
  }
};

/**
 * Regenera contenido para un rango de fechas específico
 */
export const regenerateContentForDateRange = async (profile, pillars, startDate, endDate) => {
  try {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const personalityAnalysis = analyzePersonality(profile);
    
    const content = await generateCalendarContent(personalityAnalysis, pillars, days);
    
    // Ajustar fechas al rango especificado
    const adjustedContent = content.map((post, index) => {
      const postDate = new Date(startDate);
      postDate.setDate(startDate.getDate() + index);
      return {
        ...post,
        scheduled_at: postDate.toISOString()
      };
    });

    return {
      success: true,
      content: adjustedContent,
      stats: {
        totalPosts: adjustedContent.length,
        daysCovered: days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };
  } catch (error) {
    console.error('Error regenerating content for date range:', error);
    return {
      success: false,
      error: error.message,
      content: []
    };
  }
};

/**
 * Obtiene estadísticas del contenido generado
 */
export const getContentStats = (content) => {
  if (!content || content.length === 0) {
    return {
      totalPosts: 0,
      scheduledPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      pillarsDistribution: {},
      weeklyDistribution: {},
      averagePostsPerDay: 0
    };
  }

  const stats = {
    totalPosts: content.length,
    scheduledPosts: content.filter(post => post.status === 'scheduled').length,
    publishedPosts: content.filter(post => post.status === 'published').length,
    draftPosts: content.filter(post => post.status === 'draft').length,
    pillarsDistribution: {},
    weeklyDistribution: {},
    averagePostsPerDay: 0
  };

  // Distribución por pilares
  content.forEach(post => {
    const pillar = post.pillar_id || 'unknown';
    stats.pillarsDistribution[pillar] = (stats.pillarsDistribution[pillar] || 0) + 1;
  });

  // Distribución semanal
  content.forEach(post => {
    const date = new Date(post.scheduled_at);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    stats.weeklyDistribution[dayOfWeek] = (stats.weeklyDistribution[dayOfWeek] || 0) + 1;
  });

  // Promedio de posts por día
  const dateRange = getDateRange(content);
  if (dateRange.days > 0) {
    stats.averagePostsPerDay = (content.length / dateRange.days).toFixed(1);
  }

  return stats;
};

/**
 * Obtiene el rango de fechas del contenido
 */
const getDateRange = (content) => {
  if (!content || content.length === 0) {
    return { start: null, end: null, days: 0 };
  }

  const dates = content
    .map(post => new Date(post.scheduled_at))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a - b);

  if (dates.length === 0) {
    return { start: null, end: null, days: 0 };
  }

  const start = dates[0];
  const end = dates[dates.length - 1];
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  return { start, end, days };
};

export default {
  generatePersonalizedContent,
  generateSinglePost,
  regenerateContentForDateRange,
  getContentStats
};
