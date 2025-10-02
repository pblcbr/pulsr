// src/services/postsService.js
import { supabase } from '../lib/supabase';

export const postsService = {
  // Crear nuevo post
  async createPost(postData) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Obtener posts del usuario
  async getUserPosts(userId) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Actualizar post
  async updatePost(postId, updates) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Eliminar post
  async deletePost(postId) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Obtener posts por rango de fechas
  async getPostsByDateRange(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching posts by date range:', error);
      throw error;
    }
  }
};