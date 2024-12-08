import { supabase } from '../lib/supabase';
import type { Gallery, GalleryCategory } from '../lib/supabase-types';

export async function getGalleries(userId?: string, onlyUserGalleries: boolean = false): Promise<Gallery[]> {
  try {
    let query = supabase
      .from('galleries')
      .select('*');

    if (userId) {
      if (onlyUserGalleries) {
        // Only show galleries created by the user
        query = query.eq('user_id', userId);
      } else {
        // Show public galleries + authenticated galleries + user's private galleries
        query = query.or(`visibility.eq.public,visibility.eq.authenticated,and(visibility.eq.private,user_id.eq.${userId})`);
      }
    } else {
      // If no user is logged in, only show public galleries
      query = query.eq('visibility', 'public');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching galleries:', error);
    throw error;
  }
}

export async function addGallery(
  userId: string,
  name: string,
  description: string,
  visibility: 'public' | 'private' | 'authenticated' = 'public',
  category: GalleryCategory = 'movies'
): Promise<Gallery> {
  try {
    const { data, error } = await supabase
      .from('galleries')
      .insert({
        user_id: userId,
        name,
        description,
        visibility,
        category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create gallery');

    return data;
  } catch (error) {
    console.error('Error creating gallery:', error);
    throw error;
  }
}

export async function updateGallery(
  id: string,
  updates: Partial<Gallery>
): Promise<Gallery> {
  const { data, error } = await supabase
    .from('galleries')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGallery(id: string): Promise<void> {
  const { error } = await supabase
    .from('galleries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getGallery(id: string): Promise<Gallery | null> {
  try {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching gallery:', error);
    throw error;
  }
}

export async function isGalleryOwner(galleryId: string, userId: string): Promise<boolean> {
  try {
    if (!galleryId || !userId) {
      console.log('Missing galleryId or userId:', { galleryId, userId });
      return false;
    }

    const { data, error } = await supabase
      .from('galleries')
      .select('user_id')
      .eq('id', galleryId)
      .single();

    if (error) {
      console.error('Error checking gallery ownership:', error);
      return false;
    }

    if (!data) {
      console.log('No gallery found with id:', galleryId);
      return false;
    }

    const isOwner = data.user_id === userId;
    console.log('Gallery ownership check:', { galleryId, userId, galleryUserId: data.user_id, isOwner });
    return isOwner;
  } catch (error) {
    console.error('Error checking gallery ownership:', error);
    return false;
  }
}
