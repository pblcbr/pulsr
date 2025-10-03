/* eslint-env node */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createHash } = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const OpenAI = require('openai');

const stripe = process.env.STRIPE_SECRET_KEY
  ? Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const AI_VERSION = 'content-pillars-v1';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS Configuration
const frontendUrls = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://pulsr.netlify.app',
  ...frontendUrls
];

console.log('🌐 Allowed CORS origins:', allowedOrigins);

// Enable pre-flight requests for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
  } else {
    res.sendStatus(403);
  }
});

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

function assertServerReady() {
  if (!stripe) {
    throw new Error('Stripe is not initialised. Check STRIPE_SECRET_KEY.');
  }
  if (!supabase) {
    throw new Error('Supabase client not available. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!openai) {
    throw new Error('OpenAI client not available. Set OPENAI_API_KEY.');
  }
}

function computePromptFingerprint(input) {
  return createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');
}

function buildAiPrompt(profile) {
  return `You are a senior content strategist generating LinkedIn content pillars based on detailed user onboarding data. Return a JSON object matching this TypeScript interface:
{
  "version": string; // Keep as ${AI_VERSION}
  "summary": string; // 2-3 sentence persona summary
  "pillars": Array<{
    "name": string;
    "description": string;
    "rationale": string;
    "tone": string;
    "postingIdeas": string[];
  }>;
  "strategy": {
    "cadence": string;
    "callToActions": string[];
    "contentMix": Array<{ type: string; percentage: number }>;
    "keyMetrics": string[];
  };
}

Guidelines:
- Map recommendations to the strongest personality dimensions.
- Reflect the stated business model (${profile.business_model || 'n/a'}) and audience (${profile.audience || 'n/a'}).
- Reference their positioning statement when relevant.
- Always provide 4 pillars. Tailor descriptions and rationales to the persona.
- Distribute content mix percentages that add up to 100.
- Use concise, friendly wording suitable for LinkedIn.

User data:
${JSON.stringify({
    name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || null,
    personalityTotals: {
      practical: profile.practical,
      analytical: profile.analytical,
      creative: profile.creative,
      social: profile.social,
      entrepreneurial: profile.entrepreneurial,
      organized: profile.organized,
    },
    businessModel: profile.business_model,
    audience: profile.audience,
    techComfort: profile.tech_comfort,
    structureFlex: profile.structure_flex,
    soloTeam: profile.solo_team,
    interests: profile.interest_text,
    positioningStatement: profile.positioning_statement,
  }, null, 2)}

Return only JSON.`;
}

function parseAiResponse(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^```json\n?|```$/g, '');
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse AI response', err);
    return null;
  }
}

function needsRegeneration(profile, fingerprint, force) {
  if (force) return true;
  if (!profile.content_pillars_ai || !profile.ai_prompt_fingerprint) return true;
  if (profile.ai_prompt_fingerprint !== fingerprint) return true;
  if (profile.ai_regen_required) return true;
  return false;
}

async function logAiEvent({ userId, status, fingerprint = null, message = null }) {
  if (!supabase) return;

  try {
    await supabase
      .from('ai_generation_logs')
      .insert({
        user_id: userId,
        status,
        fingerprint,
        message,
      });
  } catch (logError) {
    console.error('Failed to log AI event', logError);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    assertServerReady();
    res.json({ status: 'OK', message: 'Backend is running', aiEnabled: true });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

app.post('/api/personalization/generate', async (req, res) => {
  try {
    assertServerReady();

    const { userId, forceRegenerate } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile', profileError);
      return res.status(500).json({ error: 'Unable to load profile', details: profileError.message });
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found for user' });
    }

    const promptInput = {
      userId,
      personalityTotals: {
        practical: profile.practical,
        analytical: profile.analytical,
        creative: profile.creative,
        social: profile.social,
        entrepreneurial: profile.entrepreneurial,
        organized: profile.organized,
      },
      business_model: profile.business_model,
      audience: profile.audience,
      interests: profile.interest_text,
      positioning_statement: profile.positioning_statement,
      tech_comfort: profile.tech_comfort,
      structure_flex: profile.structure_flex,
      solo_team: profile.solo_team,
    };

    const fingerprint = computePromptFingerprint(promptInput);

    if (!needsRegeneration(profile, fingerprint, forceRegenerate)) {
      await logAiEvent({
        userId,
        status: 'skip',
        fingerprint,
        message: 'Personalized content already up to date',
      });
      return res.json({
        status: 'up-to-date',
        profile: {
          content_pillars_ai: profile.content_pillars_ai,
          content_strategy_ai: profile.content_strategy_ai,
          ai_persona_summary: profile.ai_persona_summary,
          ai_generated_at: profile.ai_generated_at,
          ai_version: profile.ai_version,
        },
      });
    }

    const systemPrompt = 'You are Pulsr\'s AI strategist who crafts bespoke LinkedIn content pillars.';
    const userPrompt = buildAiPrompt(profile);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 800,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const rawMessage = completion?.choices?.[0]?.message?.content;
    const aiPayload = parseAiResponse(rawMessage);

    if (!aiPayload || !Array.isArray(aiPayload.pillars) || !aiPayload.strategy) {
      console.error('AI payload validation failed', { rawMessage });
      return res.status(502).json({ error: 'AI response invalid', raw: rawMessage });
    }

    const updatePayload = {
      content_pillars_ai: aiPayload.pillars,
      content_strategy_ai: aiPayload.strategy,
      ai_persona_summary: aiPayload.summary,
      ai_generated_at: new Date().toISOString(),
      ai_version: aiPayload.version || AI_VERSION,
      ai_prompt_fingerprint: fingerprint,
      ai_regen_required: false,
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error writing AI results', updateError);
      await logAiEvent({
        userId,
        status: 'error',
        fingerprint,
        message: `Persist failed: ${updateError.message}`,
      });
      return res.status(500).json({ error: 'Failed to persist AI results', details: updateError.message });
    }

    await logAiEvent({
      userId,
      status: 'success',
      fingerprint,
      message: `Regenerated with version ${updatePayload.ai_version}`,
    });

    res.json({ status: 'regenerated', profile: updatePayload, supabase: updatedProfile });
  } catch (error) {
    console.error('AI personalization error', error);
    const fallbackUserId = req?.body?.userId;
    if (fallbackUserId) {
      await logAiEvent({ userId: fallbackUserId, status: 'error', message: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { planId, planName, successUrl, cancelUrl, userId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        planName: planName,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Customer Portal Session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;
    
    const defaultReturnUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL.split(',')[0]}/content-calendar`
      : 'http://localhost:5174/content-calendar';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || defaultReturnUrl,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('Payment succeeded:', session.id);
      // Here you would update your database with the subscription info
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription.id);
      // Here you would update your database with the new subscription status
      break;
    }
    case 'customer.subscription.deleted': {
      const deletedSubscription = event.data.object;
      console.log('Subscription cancelled:', deletedSubscription.id);
      // Here you would update your database to remove the subscription
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`Stripe backend server running on port ${PORT}`);
});
