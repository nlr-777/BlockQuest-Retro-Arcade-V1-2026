// supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized Supabase client
let supabase: SupabaseClient | null = null;

/**
 * Returns the Supabase client. Throws if env vars are missing.
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        'Supabase env vars missing! Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel.'
      );
      throw new Error('Supabase env vars missing!');
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

/**
 * Fetch site content (optionally by type: 'game', 'book', 'video', etc.)
 */
export const fetchSiteContent = async (type: string | null = null) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning empty site content');
    return [];
  }

  try {
    let query = getSupabase().from('site_content').select('*');
    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching site content:', error);
    return [];
  }
};

// Helpers for specific content types
export const fetchGames = () => fetchSiteContent('game');
export const fetchBooks = () => fetchSiteContent('book');
export const fetchVideos = () => fetchSiteContent('video');

/**
 * Subscribe to newsletter
 */
export const subscribeNewsletter = async (email: string) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, newsletter unavailable');
    return { success: false, message: 'Newsletter service unavailable' };
  }

  try {
    const supabase = getSupabase();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return {
        success: true,
        message: "You're already subscribed! Thanks for being part of the BlockQuest crew! 🎮",
      };
    }

    // Insert new subscriber
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    return {
      success: true,
      message: "Welcome to the BlockQuest crew! 🚀 You'll be the first to know about new chaos!",
    };
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return { success: false, message: 'Failed to subscribe. Please try again!' };
  }
};

/**
 * Game stats helpers
 */
export const getGameStats = async (userId: string) => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await getSupabase()
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // PGRST116 = no rows returned
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return null;
  }
};

export const saveGameStats = async (userId: string, stats: any) => {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from('game_stats')
      .select('id')
      .eq('user_id', userId)
      .single();

    const payload = {
      user_id: userId,
      score: stats.score || 0,
      inventory: stats.inventory || { xp: 0, badges: [], faction: null },
      last_played: new Date().toISOString(),
    };

    if (existing) {
      const { data, error } = await supabase
        .from('game_stats')
        .update(payload)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('game_stats')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving game stats:', error);
    return null;
  }
};

export default getSupabase;
