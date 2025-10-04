# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pulsr is a React-based SaaS application that provides AI-powered personality analysis and personalized content generation for social media. The app integrates with Supabase for authentication and data storage, Stripe for payments, and OpenAI for content generation.

## Commands

### Development
```bash
npm run dev          # Start Vite dev server (default: http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
```

### Backend (in backend/ directory)
```bash
npm run dev          # Start backend with nodemon (default: port 3000)
npm start            # Start backend server
```

## Architecture

### Frontend Structure

**Core Contexts:**
- `AuthContext` - Manages Supabase authentication state, signup, signin, signout, and onboarding completion tracking
- `StripeContext` - Handles Stripe checkout sessions and customer portal redirects

**Route Protection:**
- `ProtectedRoute` - Requires authentication and optionally checks for onboarding completion by querying the `profiles` table
- `PublicRoute` - Redirects authenticated users to dashboard

**Onboarding Flow:**
The app uses a dual-check system for onboarding completion:
1. User metadata flag: `user.user_metadata.has_completed_onboarding` (supports both snake_case and camelCase)
2. Profile data validation: checks if personality scores exist in the `profiles` table (analytical, practical, creative, social, entrepreneurial, organized) or if a positioning_statement is present

### Personality Analysis System

The personality analyzer ([src/services/personalityAnalyzer.js](src/services/personalityAnalyzer.js)) scores users across 6 dimensions:
- Analytical, Practical, Creative, Social, Entrepreneurial, Organized

Based on these scores, the system generates:
- **Content Pillars:** 4 themed content categories with colors
- **Content Tone:** Communication style based on personality + tech_comfort + structure_flex preferences
- **Content Strategy:** Posting frequency, engagement tactics, CTAs, and key metrics
- **Interests:** Topic recommendations for content generation

### Content Generation

Two-tier system:
1. **OpenAI Integration** ([src/services/openai.js](src/services/openai.js)) - Generates personalized posts using GPT-4 based on user personality profile
2. **Fallback Templates** - If OpenAI fails, falls back to hardcoded templates specific to personality types

Generated content includes: title, body_md (post content), summary, keywords, hashtags, and scheduled_at timestamp.

### Backend Architecture

Express server ([backend/server.js](backend/server.js)) provides:
- Stripe checkout session creation and webhooks
- Stripe customer portal sessions
- OpenAI content generation endpoints
- Supabase integration for storing payment metadata and content

**CORS Configuration:** Defaults to localhost:5173/5174 + custom origins from `VITE_FRONTEND_URL` environment variable.

### Database Schema

Key Supabase tables:
- `profiles` - User profiles with firstName, lastName, business_model, audience, positioning_statement, and personality dimension scores
- `posts` - Generated content (title, body_md, summary, keywords, hashtags, status, scheduled_at)
- `ai_logs` - Tracks AI generation requests and responses

SQL migration files are located in the root directory (supabase-*.sql).

## Environment Variables

### Frontend (.env.local)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_OPENAI_API_KEY=
VITE_BACKEND_URL=
```

### Backend (backend/.env)
```
STRIPE_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
FRONTEND_URL=
PORT=
```

## Key Implementation Notes

- **Supabase Auth:** Email confirmation is disabled for MVP (see [supabase-config.md](supabase-config.md))
- **Personality Scores:** Always check for both snake_case and camelCase variants when accessing user metadata or profile fields for backward compatibility
- **Profile Creation:** Happens automatically on signup in AuthContext, but errors don't fail the signup flow
- **Content Pillars:** Hardcoded templates per personality type with dynamic adjustments based on business_model and audience
- **AI Versioning:** Backend uses AI_VERSION constant to track content generation model versions

## Testing

Tests use Vitest. Currently has test coverage for:
- [src/services/__tests__/personalityAnalyzer.test.js](src/services/__tests__/personalityAnalyzer.test.js)

## Tech Stack

- **Frontend:** React 19, React Router 7, Vite 7, Tailwind CSS 4
- **Backend:** Express, Node.js
- **Auth & Database:** Supabase
- **Payments:** Stripe
- **AI:** OpenAI GPT-4
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
