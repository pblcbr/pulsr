/* Service to handle user profiles */
import { supabase } from '../lib/supabase';

/**
 * Gets the current user profile
 */
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile) return null;

    const normalized = {
      ...profile,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      business_model: profile.business_model ?? '',
      audience: profile.audience ?? '',
      structure_flex: profile.structure_flex ?? null,
      solo_team: profile.solo_team ?? null,
    };

    return normalized;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Updates the user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Creates a profile for the current user (if it does not exist)
 */
export const createUserProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Saves onboarding results to the profile
 */
export const saveOnboardingResults = async (onboardingResults) => {
  try {
    const profileData = {
      practical: onboardingResults.totals?.practical || 0,
      analytical: onboardingResults.totals?.analytical || 0,
      creative: onboardingResults.totals?.creative || 0,
      social: onboardingResults.totals?.social || 0,
      entrepreneurial: onboardingResults.totals?.entrepreneurial || 0,
      organized: onboardingResults.totals?.organized || 0,
      business_model: onboardingResults.business_model || '',
      audience: onboardingResults.audience || '',
      tech_comfort: onboardingResults.tech_comfort ?? null,
      // accept either old/new keys for sliders
      structure_flex: onboardingResults.structure_flex ?? onboardingResults.structured_flexible ?? null,
      solo_team: onboardingResults.solo_team ?? onboardingResults.independent_team ?? null,
      interest_text: onboardingResults.interest_text || '',
      positioning_statement: onboardingResults.positioning_statement || ''
    };

    return await updateUserProfile(profileData);
  } catch (error) {
    console.error('Error saving onboarding results:', error);
    throw error;
  }
};

export default {
  getCurrentUserProfile,
  updateUserProfile,
  createUserProfile,
  saveOnboardingResults
};
