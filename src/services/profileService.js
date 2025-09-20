// Servicio para manejar perfiles de usuario
import { supabase } from '../lib/supabase';

/**
 * Obtiene el perfil del usuario actual
 */
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Actualiza el perfil del usuario
 */
export const updateUserProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
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
 * Crea un perfil para el usuario actual (si no existe)
 */
export const createUserProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
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
 * Guarda los resultados del onboarding en el perfil
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
      tech_comfort: onboardingResults.tech_comfort || 0,
      structure_flex: onboardingResults.structured_flexible || 0,
      solo_team: onboardingResults.independent_team || 0,
      interest_text: onboardingResults.interest_text || ''
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
