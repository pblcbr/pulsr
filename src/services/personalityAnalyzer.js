// Personality analyzer based on onboarding results

/**
 * Analyzes user personality based on onboarding results
 * @param {Object} profile - User profile with personality dimensions
 * @returns {Object} Detailed personality analysis
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
    positioning_statement
  } = profile;

  // Backward/forward compatible slider fields
  const structureFlex = structure_flex ?? profile.structured_flexible ?? null;

  // Calculate totals to determine dominant type
  const totals = {
    practical: practical ?? 0,
    analytical: analytical ?? 0,
    creative: creative ?? 0,
    social: social ?? 0,
    entrepreneurial: entrepreneurial ?? 0,
    organized: organized ?? 0
  };

  // Sort by score to get dominant types
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const [primaryType, primaryScore] = sorted[0];
  const [secondaryType, secondaryScore] = sorted[1];

  // Determine main personality type
  const personalityType = getPersonalityType(primaryType, secondaryType, primaryScore, secondaryScore);

  // Resolve business model/audience with potential alternative keys
  const businessModel = business_model ?? profile.businessModel ?? profile.businessmodel ?? '';
  const audienceVal = audience ?? profile.target_audience ?? profile.targetAudience ?? profile.audience ?? '';

  // Generate content pillars based on personality
  const contentPillars = generateContentPillars(personalityType, businessModel, audienceVal);

  // Determine content tone
  const tone = getContentTone(personalityType, tech_comfort, structureFlex);

  // Generate interest topics
  const interests = generateInterests(personalityType, businessModel, audienceVal);

  return {
    personalityType,
    primaryType,
    secondaryType,
    primaryScore,
    secondaryScore,
    totals,
    contentPillars,
    tone,
    interests,
    contentStrategy: getContentStrategy(personalityType, businessModel, audienceVal),
    postingFrequency: getPostingFrequency(personalityType, structureFlex),
    positioning_statement
  };
};

/**
 * Determines the primary personality type based on scores
 */
const getPersonalityType = (primary, secondary, primaryScore, secondaryScore) => {
  const scoreDifference = primaryScore - secondaryScore;
  
  // If there is a significant difference, use the primary type
  if (scoreDifference >= 3) {
    return primary;
  }
  
  // If there is a tie or small difference, use combination
  return `${primary}-${secondary}`;
};

/**
 * Generates content pillars based on personality / Hardcoded pillars
 */
const generateContentPillars = (personalityType, businessModel, audience) => {
  const pillarTemplates = {
    'analytical': [
      { name: 'Data Analysis', description: 'Insights and analysis based on real data', color: '#3B82F6' },
      { name: 'Technology', description: 'Technology trends and tools', color: '#8B5CF6' },
      { name: 'Productivity', description: 'Tools and systems to be more efficient', color: '#F59E0B' },
      { name: 'Research', description: 'Relevant studies and findings', color: '#EF4444' }
    ],
    'entrepreneurial': [
      { name: 'Entrepreneurship', description: 'Startup strategies and lessons learned', color: '#10B981' },
      { name: 'Business', description: 'Business models and strategies', color: '#059669' },
      { name: 'Marketing', description: 'Marketing and growth strategies', color: '#DC2626' },
      { name: 'Leadership', description: 'Team management and leadership', color: '#7C3AED' }
    ],
    'creative': [
      { name: 'Creativity', description: 'Creative processes and inspiration', color: '#EC4899' },
      { name: 'Design', description: 'Design principles and aesthetics', color: '#8B5CF6' },
      { name: 'Art', description: 'Artistic and cultural expression', color: '#F59E0B' },
      { name: 'Innovation', description: 'Disruptive and creative ideas', color: '#06B6D4' }
    ],
    'practical': [
      { name: 'Tutorials', description: 'Step-by-step guides and how-to', color: '#3B82F6' },
      { name: 'Tools', description: 'Useful tools and resources', color: '#10B981' },
      { name: 'Use Cases', description: 'Real examples and applications', color: '#F59E0B' },
      { name: 'Solutions', description: 'Solutions to common problems', color: '#EF4444' }
    ],
    'social': [
      { name: 'Community', description: 'Community building and networking', color: '#10B981' },
      { name: 'Stories', description: 'Personal experiences and narratives', color: '#EC4899' },
      { name: 'Collaboration', description: 'Teamwork and collaboration', color: '#3B82F6' },
      { name: 'Networking', description: 'Connectivity and professional relationships', color: '#8B5CF6' }
    ],
    'organized': [
      { name: 'Systems', description: 'Organizational systems and processes', color: '#6B7280' },
      { name: 'Productivity', description: 'Productivity tools and methods', color: '#F59E0B' },
      { name: 'Planning', description: 'Planning and management strategies', color: '#3B82F6' },
      { name: 'Efficiency', description: 'Optimization and continuous improvement', color: '#10B981' }
    ]
  };

  // If it is a combination, mix pillars
  if (personalityType.includes('-')) {
    const [type1, type2] = personalityType.split('-');
    const pillars1 = pillarTemplates[type1] || [];
    const pillars2 = pillarTemplates[type2] || [];
    return [...pillars1.slice(0, 2), ...pillars2.slice(0, 2)];
  }

  let selected = pillarTemplates[personalityType] || pillarTemplates['analytical'];

  if (businessModel === 'service' && selected.length > 0) {
    selected = [{
      ...selected[0],
      name: 'Client Success Stories',
      description: 'Case studies and testimonials that build trust for services',
    }, ...selected.slice(1)];
  } else if (businessModel === 'content' && selected.length > 0) {
    selected = [{
      ...selected[0],
      name: 'Content Playbooks',
      description: 'Frameworks and behind-the-scenes of your content process',
    }, ...selected.slice(1)];
  }

  if (audience === 'business') {
    selected = selected.map((pillar, index) => index === 0
      ? { ...pillar, description: `${pillar.description} tailored for B2B decision makers` }
      : pillar);
  } else if (audience === 'broad_online') {
    selected = selected.map((pillar, index) => index === 0
      ? { ...pillar, description: `${pillar.description} crafted for a broad online audience` }
      : pillar);
  }

  return selected;
};

/**
 * Determines the tone of content based on personality / Hardcoded tones
 */
const getContentTone = (personalityType, techComfort, structureFlex) => {
  const toneMap = {
    'analytical': 'Professional and data-driven',
    'entrepreneurial': 'Energetic and results-oriented',
    'creative': 'Inspiring and expressive',
    'practical': 'Direct and useful',
    'social': 'Conversational and empathetic',
    'organized': 'Structured and methodical'
  };

  let baseTone = toneMap[personalityType] || 'Professional';
  
  // Adjust according to tech_comfort
  if (techComfort >= 4) {
    baseTone += ' with technical terminology';
  } else {
    baseTone += ' and accessible';
  }
  
  // Adjust according to structure
  if (structureFlex <= 2) {
    baseTone += ', structured';
  } else {
    baseTone += ', flexible';
  }

  return baseTone;
};

/**
 * Generates interest topics based on personality / Hardcoded interests
 */
const generateInterests = (personalityType, businessModel, audience) => {
  const interestMap = {
    'analytical': ['data analysis', 'technology', 'research', 'metrics', 'artificial intelligence'],
    'entrepreneurial': ['startups', 'business', 'marketing', 'leadership', 'growth'],
    'creative': ['design', 'art', 'innovation', 'creativity', 'expression'],
    'practical': ['tools', 'tutorials', 'solutions', 'use cases', 'implementation'],
    'social': ['community', 'networking', 'collaboration', 'relationships', 'communication'],
    'organized': ['productivity', 'systems', 'planning', 'efficiency', 'organization']
  };

  const baseInterests = interestMap[personalityType] || interestMap['analytical'];
  
  // Add interests based on business_model and audience
  const additionalInterests = [];
  
  if (businessModel === 'content') {
    additionalInterests.push('content', 'storytelling', 'engagement');
  } else if (businessModel === 'service') {
    additionalInterests.push('consulting', 'coaching', 'services');
  }
  
  if (audience === 'business') {
    additionalInterests.push('B2B', 'companies', 'professionals');
  } else if (audience === 'broad_online') {
    additionalInterests.push('general audience', 'viral', 'trends');
  }

  return [...baseInterests, ...additionalInterests];
};

/**
 * Generates content strategy based on personality / Hardcoded strategies
 */
const getContentStrategy = (personalityType, businessModel, audience) => {
  const strategies = {
    'analytical': {
      focus: 'Data, analysis and insights',
      format: 'Threads with data, charts, statistics',
      frequency: '3-4 posts per week',
      engagement: 'Questions that invite reflection',
      callToActions: ['Share a data point', 'Bookmark for later'],
      keyMetrics: ['Saves', 'Comments']
    },
    'entrepreneurial': {
      focus: 'Strategies, lessons and growth',
      format: 'Case studies, lessons learned',
      frequency: '5-6 posts per week',
      engagement: 'Questions about experiences',
      callToActions: ['Share your startup lesson', 'DM for resources'],
      keyMetrics: ['Profile visits', 'Lead form clicks']
    },
    'creative': {
      focus: 'Creative processes and inspiration',
      format: 'Visual content, stories, inspiration',
      frequency: '4-5 posts per week',
      engagement: 'Questions that invite creativity',
      callToActions: ['Drop your favorite inspiration', 'Share with a creative friend'],
      keyMetrics: ['Reshares', 'Follower growth']
    },
    'practical': {
      focus: 'Tutorials and practical solutions',
      format: 'Step-by-step guides, tips, tools',
      frequency: '3-4 posts per week',
      engagement: 'Questions about implementation',
      callToActions: ['Try this tactic', 'Comment if you need the template'],
      keyMetrics: ['Click-throughs', 'Comments']
    },
    'social': {
      focus: 'Community and connections',
      format: 'Personal stories, networking, collaboration',
      frequency: '4-5 posts per week',
      engagement: 'Questions that encourage conversation',
      callToActions: ['Tag someone who relates', 'Share your story'],
      keyMetrics: ['Mentions', 'Conversation depth']
    },
    'organized': {
      focus: 'Systems and productivity',
      format: 'Frameworks, methodologies, organization',
      frequency: '3-4 posts per week',
      engagement: 'Questions about organization',
      callToActions: ['Save this system', 'Comment with your workflow'],
      keyMetrics: ['Saves', 'Process inquiries']
    }
  };

  const baseStrategy = strategies[personalityType] || strategies['analytical'];
  const enrichedStrategy = { ...baseStrategy };

  if (businessModel === 'service') {
    enrichedStrategy.focus += ' • Highlight transformation and client wins';
    enrichedStrategy.callToActions = ['Book a discovery call', 'Download the service guide'];
  } else if (businessModel === 'content') {
    enrichedStrategy.focus += ' • Showcase content creation systems';
    enrichedStrategy.callToActions = ['Subscribe to the newsletter', 'Share your take'];
  }

  if (audience === 'business') {
    enrichedStrategy.keyMetrics = ['Qualified leads', 'Decision maker replies'];
  } else if (audience === 'broad_online') {
    enrichedStrategy.keyMetrics = ['Shares', 'Follower growth'];
  }

  return enrichedStrategy;
};

/**
 * Determines posting frequency based on personality
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
  
  // Adjust according to structure preference
  if (structureFlex <= 2) {
    return frequency; // Keep fixed frequency
  } else {
    return `${frequency}-${frequency + 1}`; // Flexible range
  }
};


export default {
  analyzePersonality
};
