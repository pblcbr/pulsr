// Analizador de personalidad basado en los resultados del onboarding
import computeResults from '../utils/computeResults';
import QUESTIONS from '../data/questions.json';

/**
 * Analiza la personalidad del usuario basada en los resultados del onboarding
 * @param {Object} profile - Perfil del usuario con las dimensiones de personalidad
 * @returns {Object} Análisis detallado de la personalidad
 */
export const analyzePersonality = (profile) => {
  const {
    practical,
    analytical,
    creative,
    social,
    entrepreneurial,
    organized,
    business_model,
    audience,
    tech_comfort,
    structure_flex,
    solo_team
  } = profile;

  // Calcular totales para determinar el tipo dominante
  const totals = {
    practical,
    analytical,
    creative,
    social,
    entrepreneurial,
    organized
  };

  // Ordenar por puntuación para obtener los tipos dominantes
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const [primaryType, primaryScore] = sorted[0];
  const [secondaryType, secondaryScore] = sorted[1];

  // Determinar el tipo de personalidad principal
  const personalityType = getPersonalityType(primaryType, secondaryType, primaryScore, secondaryScore);
  
  // Generar pilares de contenido basados en la personalidad
  const contentPillars = generateContentPillars(personalityType, business_model, audience);
  
  // Determinar el tono de contenido
  const tone = getContentTone(personalityType, tech_comfort, structure_flex);
  
  // Generar temas de interés
  const interests = generateInterests(personalityType, business_model, audience);

  return {
    personalityType,
    primaryType,
    secondaryType,
    primaryScore,
    secondaryScore,
    contentPillars,
    tone,
    interests,
    contentStrategy: getContentStrategy(personalityType, business_model, audience),
    postingFrequency: getPostingFrequency(personalityType, structure_flex),
    optimalTimes: getOptimalPostingTimes(personalityType, solo_team)
  };
};

/**
 * Determina el tipo de personalidad principal basado en las puntuaciones
 */
const getPersonalityType = (primary, secondary, primaryScore, secondaryScore) => {
  const scoreDifference = primaryScore - secondaryScore;
  
  // Si hay una diferencia significativa, usar el tipo primario
  if (scoreDifference >= 3) {
    return primary;
  }
  
  // Si hay empate o diferencia pequeña, usar combinación
  return `${primary}-${secondary}`;
};

/**
 * Genera pilares de contenido basados en la personalidad
 */
const generateContentPillars = (personalityType, businessModel, audience) => {
  const pillarTemplates = {
    'analytical': [
      { name: 'Análisis de Datos', description: 'Insights y análisis basados en datos reales', color: '#3B82F6' },
      { name: 'Tecnología', description: 'Tendencias y herramientas tecnológicas', color: '#8B5CF6' },
      { name: 'Productividad', description: 'Herramientas y sistemas para ser más eficiente', color: '#F59E0B' },
      { name: 'Investigación', description: 'Estudios y hallazgos relevantes', color: '#EF4444' }
    ],
    'entrepreneurial': [
      { name: 'Emprendimiento', description: 'Estrategias y lecciones aprendidas en startups', color: '#10B981' },
      { name: 'Negocios', description: 'Modelos de negocio y estrategias', color: '#059669' },
      { name: 'Marketing', description: 'Estrategias de marketing y crecimiento', color: '#DC2626' },
      { name: 'Liderazgo', description: 'Gestión de equipos y liderazgo', color: '#7C3AED' }
    ],
    'creative': [
      { name: 'Creatividad', description: 'Procesos creativos y inspiración', color: '#EC4899' },
      { name: 'Diseño', description: 'Principios de diseño y estética', color: '#8B5CF6' },
      { name: 'Arte', description: 'Expresión artística y cultural', color: '#F59E0B' },
      { name: 'Innovación', description: 'Ideas disruptivas y creativas', color: '#06B6D4' }
    ],
    'practical': [
      { name: 'Tutoriales', description: 'Guías paso a paso y cómo hacer', color: '#3B82F6' },
      { name: 'Herramientas', description: 'Herramientas y recursos útiles', color: '#10B981' },
      { name: 'Casos de Uso', description: 'Ejemplos reales y aplicaciones', color: '#F59E0B' },
      { name: 'Soluciones', description: 'Soluciones a problemas comunes', color: '#EF4444' }
    ],
    'social': [
      { name: 'Comunidad', description: 'Construcción de comunidad y networking', color: '#10B981' },
      { name: 'Historias', description: 'Experiencias personales y relatos', color: '#EC4899' },
      { name: 'Colaboración', description: 'Trabajo en equipo y colaboración', color: '#3B82F6' },
      { name: 'Networking', description: 'Conectividad y relaciones profesionales', color: '#8B5CF6' }
    ],
    'organized': [
      { name: 'Sistemas', description: 'Sistemas y procesos organizacionales', color: '#6B7280' },
      { name: 'Productividad', description: 'Herramientas y métodos de productividad', color: '#F59E0B' },
      { name: 'Planificación', description: 'Estrategias de planificación y gestión', color: '#3B82F6' },
      { name: 'Eficiencia', description: 'Optimización y mejora continua', color: '#10B981' }
    ]
  };

  // Si es una combinación, mezclar pilares
  if (personalityType.includes('-')) {
    const [type1, type2] = personalityType.split('-');
    const pillars1 = pillarTemplates[type1] || [];
    const pillars2 = pillarTemplates[type2] || [];
    return [...pillars1.slice(0, 2), ...pillars2.slice(0, 2)];
  }

  return pillarTemplates[personalityType] || pillarTemplates['analytical'];
};

/**
 * Determina el tono de contenido basado en la personalidad
 */
const getContentTone = (personalityType, techComfort, structureFlex) => {
  const toneMap = {
    'analytical': 'Profesional y basado en datos',
    'entrepreneurial': 'Energético y orientado a resultados',
    'creative': 'Inspirador y expresivo',
    'practical': 'Directo y útil',
    'social': 'Conversacional y empático',
    'organized': 'Estructurado y metódico'
  };

  let baseTone = toneMap[personalityType] || 'Profesional';
  
  // Ajustar según tech_comfort
  if (techComfort >= 4) {
    baseTone += ' con terminología técnica';
  } else {
    baseTone += ' y accesible';
  }
  
  // Ajustar según estructura
  if (structureFlex <= 2) {
    baseTone += ', estructurado';
  } else {
    baseTone += ', flexible';
  }

  return baseTone;
};

/**
 * Genera temas de interés basados en la personalidad
 */
const generateInterests = (personalityType, businessModel, audience) => {
  const interestMap = {
    'analytical': ['análisis de datos', 'tecnología', 'investigación', 'métricas', 'inteligencia artificial'],
    'entrepreneurial': ['startups', 'negocios', 'marketing', 'liderazgo', 'crecimiento'],
    'creative': ['diseño', 'arte', 'innovación', 'creatividad', 'expresión'],
    'practical': ['herramientas', 'tutoriales', 'soluciones', 'casos de uso', 'implementación'],
    'social': ['comunidad', 'networking', 'colaboración', 'relaciones', 'comunicación'],
    'organized': ['productividad', 'sistemas', 'planificación', 'eficiencia', 'organización']
  };

  const baseInterests = interestMap[personalityType] || interestMap['analytical'];
  
  // Agregar intereses basados en business_model y audience
  const additionalInterests = [];
  
  if (businessModel === 'content') {
    additionalInterests.push('contenido', 'storytelling', 'engagement');
  } else if (businessModel === 'service') {
    additionalInterests.push('consultoría', 'coaching', 'servicios');
  }
  
  if (audience === 'business') {
    additionalInterests.push('B2B', 'empresas', 'profesionales');
  } else if (audience === 'broad_online') {
    additionalInterests.push('audiencia general', 'viral', 'tendencias');
  }

  return [...baseInterests, ...additionalInterests];
};

/**
 * Genera estrategia de contenido basada en la personalidad
 */
const getContentStrategy = (personalityType, businessModel, audience) => {
  const strategies = {
    'analytical': {
      focus: 'Datos, análisis y insights',
      format: 'Hilos con datos, gráficos, estadísticas',
      frequency: '3-4 posts por semana',
      engagement: 'Preguntas que inviten a la reflexión'
    },
    'entrepreneurial': {
      focus: 'Estrategias, lecciones y crecimiento',
      format: 'Casos de estudio, lecciones aprendidas',
      frequency: '5-6 posts por semana',
      engagement: 'Preguntas sobre experiencias'
    },
    'creative': {
      focus: 'Procesos creativos e inspiración',
      format: 'Contenido visual, historias, inspiración',
      frequency: '4-5 posts por semana',
      engagement: 'Preguntas que inviten a la creatividad'
    },
    'practical': {
      focus: 'Tutoriales y soluciones prácticas',
      format: 'Guías paso a paso, tips, herramientas',
      frequency: '3-4 posts por semana',
      engagement: 'Preguntas sobre implementación'
    },
    'social': {
      focus: 'Comunidad y conexiones',
      format: 'Historias personales, networking, colaboración',
      frequency: '4-5 posts por semana',
      engagement: 'Preguntas que fomenten la conversación'
    },
    'organized': {
      focus: 'Sistemas y productividad',
      format: 'Frameworks, metodologías, organización',
      frequency: '3-4 posts por semana',
      engagement: 'Preguntas sobre organización'
    }
  };

  return strategies[personalityType] || strategies['analytical'];
};

/**
 * Determina la frecuencia de posting basada en la personalidad
 */
const getPostingFrequency = (personalityType, structureFlex) => {
  const baseFrequency = {
    'analytical': 3,
    'entrepreneurial': 5,
    'creative': 4,
    'practical': 3,
    'social': 4,
    'organized': 3
  };

  const frequency = baseFrequency[personalityType] || 3;
  
  // Ajustar según preferencia de estructura
  if (structureFlex <= 2) {
    return frequency; // Mantener frecuencia fija
  } else {
    return `${frequency}-${frequency + 1}`; // Rango flexible
  }
};

/**
 * Determina los horarios óptimos para posting
 */
const getOptimalPostingTimes = (personalityType, soloTeam) => {
  const timeMap = {
    'analytical': ['09:00', '14:00', '16:00'],
    'entrepreneurial': ['08:00', '12:00', '18:00'],
    'creative': ['10:00', '15:00', '20:00'],
    'practical': ['09:00', '13:00', '17:00'],
    'social': ['08:00', '12:00', '19:00'],
    'organized': ['09:00', '14:00', '16:00']
  };

  return timeMap[personalityType] || timeMap['analytical'];
};

export default {
  analyzePersonality
};
