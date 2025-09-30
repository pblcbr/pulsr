import { describe, it, expect } from 'vitest';
import { analyzePersonality } from '../personalityAnalyzer';

const buildProfile = (overrides = {}) => ({
  practical: 12,
  analytical: 18,
  creative: 9,
  social: 11,
  entrepreneurial: 15,
  organized: 7,
  business_model: 'service',
  audience: 'business',
  tech_comfort: 4,
  structure_flex: 4,
  solo_team: 'solo',
  interest_text: 'AI, analytics, automation',
  positioning_statement: 'Helping operators automate their growth',
  ...overrides,
});

describe('analyzePersonality', () => {
  it('returns totals with defaulted zero values', () => {
    const profile = buildProfile({ practical: null, organized: undefined });
    const result = analyzePersonality(profile);

    expect(result.totals).toBeDefined();
    expect(result.totals.practical).toBe(0);
    expect(result.totals.organized).toBe(0);
    expect(result.totals.analytical).toBe(18);
  });

  it('derives primary and secondary types from the highest scores', () => {
    const profile = buildProfile();
    const result = analyzePersonality(profile);

    expect(result.primaryType).toBe('analytical');
    expect(result.secondaryType).toBe('entrepreneurial');
    expect(result.primaryScore).toBe(18);
    expect(result.secondaryScore).toBe(15);
  });

  it('generates four content pillars and respects business model context', () => {
    const profile = buildProfile({ business_model: 'service' });
    const result = analyzePersonality(profile);

    expect(result.contentPillars).toHaveLength(4);
    expect(result.contentPillars[0]).toHaveProperty('name');
    expect(result.contentPillars[0]).toHaveProperty('description');
  });

  it('adjusts tone and posting frequency based on structure preference', () => {
    const profile = buildProfile({ structure_flex: 5, tech_comfort: 2 });
    const result = analyzePersonality(profile);

    expect(result.tone).toMatch(/flexible/i);
    expect(result.postingFrequency).toBe('3-4');
  });
});
