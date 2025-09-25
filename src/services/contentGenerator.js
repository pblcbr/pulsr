// Content generator that integrates personality, pillars and OpenAI
import { analyzePersonality } from './personalityAnalyzer';
import { generateContent } from './openai';
// We no longer need to import generateMockContent

/**
 * Generates personalized content based on user profile
 * @param {Object} profile - User profile with personality data
 * @param {Array} pillars - User content pillars
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generation result
 */
export const generatePersonalizedContent = async (profile, pillars, options = {}) => {
  try {
    // Analyze user personality
    const personalityAnalysis = analyzePersonality(profile);
    
    // Configure default options
  const {
    days = 30,
    includeWeekends = true,
    postingFrequency = 'auto'
  } = options;

    // Determine posting frequency
    const frequency = postingFrequency === 'auto' 
      ? personalityAnalysis.postingFrequency 
      : postingFrequency;

    // Generate posting dates
    const postingDates = generatePostingDates(days, frequency, includeWeekends);
    
    let content = [];

    // Always use OpenAI to generate content
    content = await generateCalendarContent(personalityAnalysis, pillars, days);

    // Assign posting dates
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
 * Generates posting dates based on frequency and preferences
 */
const generatePostingDates = (days, frequency, includeWeekends) => {
  const dates = [];
  const startDate = new Date();
  
  // Parse frequency
  let postsPerDay;
  if (typeof frequency === 'string' && frequency.includes('-')) {
    const [min, max] = frequency.split('-').map(Number);
    postsPerDay = Math.floor(Math.random() * (max - min + 1)) + min;
  } else {
    postsPerDay = parseInt(frequency) || 1;
  }

  // Optimal schedules by day of the week
  const optimalTimes = getOptimalPostingTimes();

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Skip weekends if not included
    if (!includeWeekends && (dayName === 'saturday' || dayName === 'day')) {
      continue;
    }

    // Generate schedules for this day
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
 * Assigns posting dates to generated content
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
 * Generates a single post based on a specific pillar
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
 * Regenerates content for a specific date range
 */
export const regenerateContentForDateRange = async (profile, pillars, startDate, endDate) => {
  try {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const personalityAnalysis = analyzePersonality(profile);
    
    const content = await generateCalendarContent(personalityAnalysis, pillars, days);
    
    // Adjust dates to the specified range
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
 * Gets statistics of generated content
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

  // Distribution by pillars
  content.forEach(post => {
    const pillar = post.pillar_id || 'unknown';
    stats.pillarsDistribution[pillar] = (stats.pillarsDistribution[pillar] || 0) + 1;
  });

  // Weekly distribution
  content.forEach(post => {
    const date = new Date(post.scheduled_at);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    stats.weeklyDistribution[dayOfWeek] = (stats.weeklyDistribution[dayOfWeek] || 0) + 1;
  });

  // Average posts per day
  const dateRange = getDateRange(content);
  if (dateRange.days > 0) {
    stats.averagePostsPerDay = (content.length / dateRange.days).toFixed(1);
  }

  return stats;
};

/**
 * Gets the date range of the content
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

/**
 * Generates multiple posts for a calendar using OpenAI
 */
export const generateCalendarContent = async (profile, pillars, days = 30) => {
  const content = [];
  const startDate = new Date();
  
  for (let i = 0; i < days; i++) {
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(startDate.getDate() + i);
    
    // Select random pillar
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
      // Continue with the next day
    }
  }
  
  return content;
};

/**
 * Gets optimal posting times by day of the week
 */
const getOptimalPostingTimes = () => {
  return {
    monday: ['09:00', '14:00', '16:00'],
    tuesday: ['09:00', '14:00', '16:00'],
    wednesday: ['09:00', '14:00', '16:00'],
    thursday: ['09:00', '14:00', '16:00'],
    friday: ['09:00', '14:00', '16:00'],
    saturday: ['10:00', '15:00', '19:00'],
    sunday: ['10:00', '15:00', '19:00']
  };
};

export default {
  generatePersonalizedContent,
  generateSinglePost,
  regenerateContentForDateRange,
  getContentStats,
  generateCalendarContent
};
