import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PaymentButton from '../components/PaymentButton';
import { analyzePersonality } from '../services/personalityAnalyzer';
import { generatePersonalizedContent } from '../services/contentGenerator';
import { getCurrentUserProfile } from '../services/profileService';
import { formatDistanceToNow } from 'date-fns';

const ContentCalendar = () => {
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [pillars, setPillars] = useState([]);
  const [content, setContent] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallPlan, setPaywallPlan] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Pricing plans configuration (PRO plans only; "Today" is handled separately)
  const pricingPlans = {
    '1-post-week': {
      name: 'Starter',
      price: '€9',
      period: 'month',
      planId: 'price_1SD5F10vavtbXuhokhR1OStd',
      frequency: '1 post/week',
      postsPerMonth: 4,
      features: ['1 post per week', 'Email support'],
      description: 'Perfect for getting started with consistent content',
      icon: '📝',
    },
    '3-posts-week': {
      name: 'Growth',
      price: '€19',
      period: 'month',
      planId: 'price_1SD5FZ0vavtbXuhoXDidjRHA',
      frequency: '3 posts/week',
      postsPerMonth: 12,
      features: ['3 posts per week', 'Priority support', 'Calendar view'],
      description: 'Ideal for growing your online presence',
      icon: '🚀',
    },
    'daily-posts': {
      name: 'Pro',
      price: '€39',
      period: 'month',
      planId: 'price_1SD5Fq0vavtbXuhomJg9fax6',
      frequency: 'Daily posts',
      postsPerMonth: 30,
      features: ['Daily posts', 'Priority support', 'Calendar view'],
      description: 'For serious content creators and businesses',
      icon: '⭐',
    },
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentProfile = await getCurrentUserProfile();

        if (!currentProfile) {
          console.warn('No profile found for current user.');
          setProfile(null);
          return;
        }

        setProfile(currentProfile);

        const analysis = analyzePersonality(currentProfile);

        const rawPillars =
          Array.isArray(currentProfile.content_pillars_ai) && currentProfile.content_pillars_ai.length > 0
            ? currentProfile.content_pillars_ai
            : analysis.contentPillars;

        const enhancedPillars = rawPillars.map((pillar, index) => ({
          id: pillar.id || `pillar-${index}`,
          name: pillar.name,
          description: pillar.description,
          rationale: pillar.rationale,
          tone: pillar.tone,
          postingIdeas: pillar.postingIdeas,
        }));

        setPillars(enhancedPillars);
        setSelectedPillar(enhancedPillars[0]?.id || null);
        setContent([]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setProfileLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today':
        return 'Today';
      case '1-post-week':
        return '1 Post/Week';
      case '3-posts-week':
        return '3 Posts/Week';
      case 'daily-posts':
        return 'Daily Posts';
      default:
        return 'Today';
    }
  };

  const getPostsCount = (period) => {
    switch (period) {
      case 'today':
        return 1;
      case '1-post-week':
        return 1;
      case '3-posts-week':
        return 3;
      case 'daily-posts':
        return 7; // generate a week at a time
      default:
        return 1;
    }
  };

  const handleGenerateContent = async () => {
    if (!profile || !pillars.length) return;

    setIsGenerating(true);
    try {
      const postsCount = getPostsCount(selectedPeriod);
      const result = await generatePersonalizedContent(profile, pillars, {
        postsCount,
        includeWeekends: true,
        postingFrequency: 'auto',
        pillarId: selectedPillar || undefined,
      });

      if (result?.success) {
        setContent(result.content || []);
      } else {
        console.error('Error generating content:', result?.error);
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    // Only handle "Today" option - pro options show paywall immediately
    if (selectedPeriod === 'today') {
      handleGenerateContent();
    } else {
      // Safety: if user somehow clicks generate while a pro period is selected, open paywall
      openPaywall(selectedPeriod);
    }
  };

  const handlePeriodClick = (key) => {
    if (key === 'today') {
      setSelectedPeriod('today');
      return;
    }
    setSelectedPeriod(key);
    openPaywall(key);
  };

  const openPaywall = (planKey) => {
    setPaywallPlan(pricingPlans[planKey]);
    setShowPaywall(true);
  };

  const closePaywall = () => {
    setShowPaywall(false);
    setPaywallPlan(null);
  };

  const openModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessToast();
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const showSuccessToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Early returns while loading / when profile missing
  if (!profileLoaded) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
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

  if (!profile) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <p className="text-gray-900 font-medium">We need a profile before we can build your calendar.</p>
                <p className="text-gray-600">Complete onboarding to generate your personalized pillars.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const hasAiPillars = Array.isArray(profile.content_pillars_ai) && profile.content_pillars_ai.length > 0;
  const strategy = hasAiPillars ? profile.content_strategy_ai || {} : {};
  const aiUpdatedRelative = profile.ai_generated_at
    ? formatDistanceToNow(new Date(profile.ai_generated_at), { addSuffix: true })
    : null;
  const personaSummary = hasAiPillars ? profile.ai_persona_summary : null;
  const strategyCadence = strategy.cadence;
  const strategyCallsToAction = Array.isArray(strategy.callToActions) ? strategy.callToActions : [];
  const strategyKeyMetrics = Array.isArray(strategy.keyMetrics) ? strategy.keyMetrics : [];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Calendar</h1>
            <p className="text-gray-600">Generate personalized content based on your personality profile</p>
          </div>

          {hasAiPillars && (
            <div className="mb-8 bg-white border border-orange-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Your AI Persona</h2>
                  {personaSummary ? (
                    <p className="text-gray-700 leading-relaxed">{personaSummary}</p>
                  ) : (
                    <p className="text-gray-600">Personalized summary pending from AI.</p>
                  )}
                </div>
                {aiUpdatedRelative && <div className="text-sm text-gray-500">Updated {aiUpdatedRelative}</div>}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-orange-700 mb-1">Cadence</p>
                  <p className="text-gray-900 font-medium">{strategyCadence || 'Use default frequency below'}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-orange-700 mb-1">Calls to Action</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {strategyCallsToAction.length > 0 ? (
                      strategyCallsToAction.map((cta, index) => <li key={index}>• {cta}</li>)
                    ) : (
                      <li>Prompt audience engagement each post.</li>
                    )}
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-orange-700 mb-1">Key Metrics</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {strategyKeyMetrics.length > 0 ? (
                      strategyKeyMetrics.map((metric, index) => <li key={index}>• {metric}</li>)
                    ) : (
                      <li>Monitor saves and meaningful replies.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Pillar Selector */}
          {pillars.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select pillar</label>
              <select
                className="w-full md:w-64 border border-gray-300 rounded-md p-2 bg-white"
                value={selectedPillar || ''}
                onChange={(e) => setSelectedPillar(e.target.value)}
              >
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Content Period</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* PRO cards */}
              {Object.entries(pricingPlans).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => handlePeriodClick(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPeriod === key ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{plan.icon}</div>
                    <div className="font-semibold text-gray-900">{getPeriodLabel(key)}</div>
                    <div className="text-sm text-gray-600">{plan.frequency}</div>
                    <div className="text-xs text-orange-600 mt-1">Pro Feature</div>
                  </div>
                </button>
              ))}

              {/* Free card */}
              <button
                onClick={() => handlePeriodClick('today')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === 'today' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="font-semibold text-gray-900">Today</div>
                  <div className="text-sm text-gray-600">Free</div>
                </div>
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="px-6 py-4 my-5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate content</span>
              )}
            </button>
          </div>

          {/* Content Display */}
          <div className="bg-white rounded-lg shadow">
            {isGenerating ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating personalized content...</p>
                </div>
              </div>
            ) : content.length > 0 ? (
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Generated Content</h3>
                <div className="space-y-4">
                  {content.map((post, index) => (
                    <div
                      key={index}
                      onClick={() => openModal(post)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              {post.pillar_name || 'No pillar'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString() : 'No date'}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{post.title}</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                        </div>
                        <div className="text-orange-600 text-sm">View Details →</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Yet</h3>
                <p className="text-gray-600">Click "Generate content" to create personalized posts</p>
              </div>
            )}
          </div>

          {/* Success Toast */}
          {showToast && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              Content copied to clipboard! ✅
            </div>
          )}
        </main>
      </div>

      {/* Post Detail Modal */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {selectedPost.pillar_name || 'No pillar'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedPost.scheduled_at
                        ? new Date(selectedPost.scheduled_at).toLocaleDateString()
                        : 'No date'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h2>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Content</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedPost.content)}
                    className="mt-2 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                  >
                    Copy Content
                  </button>
                </div>

                {selectedPost.hashtags && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Hashtags</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800">{selectedPost.hashtags}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedPost.hashtags)}
                      className="mt-2 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                    >
                      Copy Hashtags
                    </button>
                  </div>
                )}

                {selectedPost.tone && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tone</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">{selectedPost.tone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && paywallPlan && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">{paywallPlan.icon}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{paywallPlan.name}</h2>
                <p className="text-gray-600">{paywallPlan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {paywallPlan.price}
                  <span className="text-lg text-gray-500">/{paywallPlan.period}</span>
                </div>
                <p className="text-gray-600">{paywallPlan.frequency}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
                <ul className="space-y-2">
                  {paywallPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <PaymentButton
                  planId={paywallPlan.planId}
                  planName={paywallPlan.name}
                  price={paywallPlan.price}
                  period={paywallPlan.period}
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                />
                <button onClick={closePaywall} className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors">
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCalendar;
