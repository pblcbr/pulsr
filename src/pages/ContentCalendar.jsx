import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PaymentButton from '../components/PaymentButton';
import { mockProfile } from '../data/mockProfile';
import { analyzePersonality } from '../services/personalityAnalyzer';
import { generatePersonalizedContent } from '../services/contentGenerator';

const ContentCalendar = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pillars, setPillars] = useState([]);
  const [content, setContent] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personalityAnalysis, setPersonalityAnalysis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallPlan, setPaywallPlan] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Pricing plans configuration
  const pricingPlans = {
    '1-post-week': {
      name: 'Starter',
      price: '€9',
      period: 'month',
      planId: 'price_1SD5F10vavtbXuhokhR1OStd',
      frequency: '1 post/week',
      postsPerMonth: 4,
      features: ['1 post per week', 'Basic content templates', 'Email support'],
      description: 'Perfect for getting started with consistent content',
      icon: '📝'
    },
    '3-posts-week': {
      name: 'Growth',
      price: '€19',
      period: 'month',
      planId: 'price_1SD5FZ0vavtbXuhoXDidjRHA',
      frequency: '3 posts/week',
      postsPerMonth: 12,
      features: ['3 posts per week', 'Advanced templates', 'Priority support', 'Analytics'],
      description: 'Ideal for growing your online presence',
      icon: '🚀'
    },
    'daily-posts': {
      name: 'Pro',
      price: '€39',
      period: 'month',
      planId: 'price_1SD5Fq0vavtbXuhomJg9fax6',
      frequency: 'Daily posts',
      postsPerMonth: 30,
      features: ['Daily posts', 'Premium templates', '24/7 support', 'Advanced analytics', 'Custom branding'],
      description: 'For serious content creators and businesses',
      icon: '⭐'
    }
  };

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

  const getPeriodDays = (period) => {
    switch (period) {
      case 'today': return 1;
      case '1-post-week': return 7;
      case '3-posts-week': return 7;
      case 'daily-posts': return 7;
      default: return 1;
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today': return 'Today';
      case '1-post-week': return '1 Post/Week';
      case '3-posts-week': return '3 Posts/Week';
      case 'daily-posts': return 'Daily Posts';
      default: return 'Today';
    }
  };

  const getPostsCount = (period) => {
    switch (period) {
      case 'today': return 1;
      case '1-post-week': return 1;
      case '3-posts-week': return 3;
      case 'daily-posts': return 7;
      default: return 1;
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

  const handleGenerateClick = () => {
    if (selectedPeriod === 'today') {
      handleGenerateContent();
    } else {
      openPaywall(selectedPeriod);
    }
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

  if (!profile) {
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

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Content Calendar
            </h1>
            <p className="text-gray-600">
              Generate personalized content based on your personality profile
            </p>
          </div>

          {/* Period Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Content Period</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(pricingPlans).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPeriod(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPeriod === key
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{plan.icon}</div>
                    <div className="font-semibold text-gray-900">{getPeriodLabel(key)}</div>
                    <div className="text-sm text-gray-600">{plan.frequency}</div>
                    {key !== 'today' && (
                      <div className="text-xs text-orange-600 mt-1">Pro Feature</div>
                    )}
                  </div>
                </button>
              ))}
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === 'today'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
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
          <div className="mb-8">
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate Content for {getPeriodLabel(selectedPeriod)}</span>
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
                              {post.pillar}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(post.date).toLocaleDateString()}
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
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Yet</h3>
                <p className="text-gray-600">Click "Generate Content" to create personalized posts</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {selectedPost.pillar}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedPost.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h2>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
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
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                      {selectedPost.tone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && paywallPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                <button
                  onClick={closePaywall}
                  className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
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