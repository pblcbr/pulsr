// Servicio de OpenAI para generación de contenido personalizado
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Genera contenido personalizado usando OpenAI basado en el perfil del usuario
 * @param {Object} profile - Perfil del usuario con personalidad analizada
 * @param {Object} pillar - Pilar de contenido específico
 * @param {Date} scheduledDate - Fecha programada para el contenido
 * @returns {Promise<Object>} Contenido generado
 */
export const generateContent = async (profile, pillar, scheduledDate) => {
  try {
    const prompt = buildContentPrompt(profile, pillar, scheduledDate);
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing de contenidos y generación de posts para redes sociales. Generas contenido personalizado basado en el perfil de personalidad del usuario.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    return parseGeneratedContent(generatedContent, profile, pillar, scheduledDate);
  } catch (error) {
    console.error('Error generating content:', error);
    // Fallback a contenido mock si falla la API
    return generateFallbackContent(profile, pillar, scheduledDate);
  }
};

/**
 * Construye el prompt para OpenAI basado en el perfil del usuario
 */
const buildContentPrompt = (profile, pillar, scheduledDate) => {
  const { personalityType, tone, interests, contentStrategy } = profile;
  const dayOfWeek = scheduledDate.toLocaleDateString('es-ES', { weekday: 'long' });
  const month = scheduledDate.toLocaleDateString('es-ES', { month: 'long' });
  
  return `
Genera un post para Twitter basado en el siguiente perfil de usuario:

**Perfil de Personalidad:**
- Tipo: ${personalityType}
- Tono: ${tone}
- Intereses: ${interests.join(', ')}
- Estrategia: ${contentStrategy.focus}

**Pilar de Contenido:**
- Nombre: ${pillar.name}
- Descripción: ${pillar.description}

**Contexto:**
- Fecha: ${dayOfWeek}, ${month}
- Plataforma: Twitter
- Formato: Hilo de Twitter (máximo 4 tweets)

**Requisitos:**
1. El contenido debe ser auténtico y personal
2. Usar el tono especificado: ${tone}
3. Incluir datos, estadísticas o insights cuando sea apropiado
4. Terminar con una pregunta que invite a la interacción
5. Usar hashtags relevantes (máximo 3)
6. Mantener un enfoque en: ${contentStrategy.focus}

**Formato de respuesta:**
{
  "title": "Título del post",
  "body_md": "Contenido en formato Markdown",
  "summary": "Resumen del contenido",
  "keywords": "palabras clave separadas por comas",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}

Genera contenido que sea valioso, auténtico y que refleje la personalidad ${personalityType} del usuario.
`;
};

/**
 * Parsea el contenido generado por OpenAI
 */
const parseGeneratedContent = (generatedContent, profile, pillar, scheduledDate) => {
  try {
    // Intentar parsear como JSON
    const content = JSON.parse(generatedContent);
    
    return {
      title: content.title || `Post sobre ${pillar.name}`,
      body_md: content.body_md || generatedContent,
      summary: content.summary || `Contenido sobre ${pillar.name}`,
      keywords: content.keywords || pillar.name.toLowerCase(),
      hashtags: content.hashtags || [`#${pillar.name.toLowerCase().replace(/\s+/g, '')}`],
      status: 'draft',
      scheduled_at: scheduledDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    // Si no es JSON válido, usar el contenido tal como viene
    return {
      title: `Post sobre ${pillar.name}`,
      body_md: generatedContent,
      summary: `Contenido generado sobre ${pillar.name}`,
      keywords: pillar.name.toLowerCase(),
      hashtags: [`#${pillar.name.toLowerCase().replace(/\s+/g, '')}`],
      status: 'draft',
      scheduled_at: scheduledDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

/**
 * Genera contenido de fallback si falla la API de OpenAI
 */
const generateFallbackContent = (profile, pillar, scheduledDate) => {
  const { personalityType, interests } = profile;
  const templates = getFallbackTemplates(personalityType);
  const template = templates[Math.floor(Math.random() * templates.length)];
  const topic = interests[Math.floor(Math.random() * interests.length)];
  
  const content = template.replace('{topic}', topic).replace('{pillar}', pillar.name);
  
  return {
    title: `Post sobre ${pillar.name}`,
    body_md: content,
    summary: `Contenido sobre ${pillar.name}`,
    keywords: `${pillar.name.toLowerCase()}, ${topic}`,
    hashtags: [`#${pillar.name.toLowerCase().replace(/\s+/g, '')}`, `#${topic.replace(/\s+/g, '')}`],
    status: 'draft',
    scheduled_at: scheduledDate.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

/**
 * Plantillas de fallback por tipo de personalidad
 */
const getFallbackTemplates = (personalityType) => {
  const templates = {
    'analytical': [
      "Los datos sobre {topic} que más me sorprendieron:\n\n1. [Dato 1]\n2. [Dato 2]\n3. [Dato 3]\n\n¿Cuál te parece más interesante?",
      "Análisis de {topic}: lo que aprendí después de estudiar [X] casos\n\n[Insight principal]\n\n¿Has observado esto también?",
      "Mi framework para analizar {topic}:\n\n📊 [Paso 1]\n📈 [Paso 2]\n📋 [Paso 3]\n\n¿Qué agregarías?",
      "El error más común en {topic} según los datos:\n\n❌ [Error común]\n✅ [Solución]\n\n¿Has cometido este error?"
    ],
    'entrepreneurial': [
      "La lección más importante que aprendí sobre {topic}:\n\n[Lección principal]\n\n¿Cuál ha sido tu experiencia?",
      "3 estrategias de {topic} que funcionan:\n\n1. [Estrategia 1]\n2. [Estrategia 2]\n3. [Estrategia 3]\n\n¿Cuál probarías?",
      "Mi experiencia con {topic} en startups:\n\n[Experiencia personal]\n\n¿Qué has aprendido tú?",
      "El framework que uso para {topic}:\n\n[Framework]\n\n¿Cómo lo harías tú?"
    ],
    'creative': [
      "Mi proceso creativo para {topic}:\n\n🎨 [Paso 1]\n💡 [Paso 2]\n✨ [Paso 3]\n\n¿Cuál es tu proceso?",
      "La inspiración detrás de {topic}:\n\n[Fuente de inspiración]\n\n¿Qué te inspira?",
      "3 formas creativas de abordar {topic}:\n\n1. [Enfoque 1]\n2. [Enfoque 2]\n3. [Enfoque 3]\n\n¿Cuál te gusta más?",
      "El lado creativo de {topic}:\n\n[Perspectiva creativa]\n\n¿Cómo lo ves tú?"
    ],
    'practical': [
      "Cómo hacer {topic} paso a paso:\n\n1. [Paso 1]\n2. [Paso 2]\n3. [Paso 3]\n\n¿Te funciona?",
      "La herramienta que revolucionó mi {topic}:\n\n[Herramienta]\n\n¿Cuál usas tú?",
      "3 tips prácticos para {topic}:\n\n💡 [Tip 1]\n🔧 [Tip 2]\n⚡ [Tip 3]\n\n¿Cuál agregarías?",
      "Mi solución para {topic}:\n\n[Solución]\n\n¿Cómo lo resuelves tú?"
    ],
    'social': [
      "La conversación que cambió mi perspectiva sobre {topic}:\n\n[Conversación]\n\n¿Qué conversación te marcó?",
      "Lo que aprendí de la comunidad sobre {topic}:\n\n[Aprendizaje]\n\n¿Qué has aprendido tú?",
      "Mi experiencia colaborando en {topic}:\n\n[Experiencia]\n\n¿Has colaborado en algo similar?",
      "El poder de la comunidad en {topic}:\n\n[Reflexión]\n\n¿Qué opinas?"
    ],
    'organized': [
      "Mi sistema para {topic}:\n\n📋 [Sistema]\n\n¿Cómo lo organizas tú?",
      "El framework que uso para {topic}:\n\n[Framework]\n\n¿Qué framework usas?",
      "3 pasos para organizar {topic}:\n\n1. [Paso 1]\n2. [Paso 2]\n3. [Paso 3]\n\n¿Te funciona?",
      "La metodología que revolucionó mi {topic}:\n\n[Metodología]\n\n¿Cuál usas tú?"
    ]
  };

  return templates[personalityType] || templates['analytical'];
};

/**
 * Genera múltiples posts para un calendario
 */
export const generateCalendarContent = async (profile, pillars, days = 30) => {
  const content = [];
  const startDate = new Date();
  
  for (let i = 0; i < days; i++) {
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(startDate.getDate() + i);
    
    // Seleccionar pilar aleatorio
    const pillar = pillars[Math.floor(Math.random() * pillars.length)];
    
    try {
      const post = await generateContent(profile, pillar, scheduledDate);
      content.push({
        id: `generated-${Date.now()}-${i}`,
        user_id: profile.user_id,
        profile_id: profile.id,
        type: 'tweet',
        channel: 'Twitter',
        pillar_id: pillar.id,
        ...post
      });
    } catch (error) {
      console.error(`Error generating content for day ${i}:`, error);
      // Continuar con el siguiente día
    }
  }
  
  return content;
};

export default {
  generateContent,
  generateCalendarContent
};
