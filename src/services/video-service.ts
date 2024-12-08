import { supabase } from '../lib/supabase';
import type { Video, TagGroup } from '../lib/supabase-types';

// Cache a videóknak és tag csoportoknak
const videoCache = new Map<string, { data: Video[]; timestamp: number }>();
const tagGroupCache = new Map<string, { data: TagGroup[]; timestamp: number }>();

// Cache érvényességi idő (5 perc)
const CACHE_TTL = 5 * 60 * 1000;

// Cache törlése egy adott galériához
function invalidateGalleryCache(galleryId: string) {
  videoCache.delete(galleryId);
  tagGroupCache.delete(galleryId);
}

export async function getVideos(galleryId: string): Promise<Video[]> {
  try {
    // Ellenőrizzük a cache-t
    const cached = videoCache.get(galleryId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Cache frissítése
    videoCache.set(galleryId, {
      data: data || [],
      timestamp: Date.now()
    });

    return data || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
}

export async function addVideo(
  galleryId: string,
  title: string, 
  description: string,
  youtubeId: string, 
  tags: { [key: string]: string[] }
): Promise<Video> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert([{ 
        title, 
        description,
        youtube_id: youtubeId, 
        tags,
        gallery_id: galleryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache for this gallery
    invalidateGalleryCache(galleryId);
    
    // Emit a custom event to notify about the new video
    const event = new CustomEvent('videoAdded', { 
      detail: { galleryId, video: data } 
    });
    window.dispatchEvent(event);

    return data;
  } catch (error) {
    console.error('Error adding video:', error);
    throw error;
  }
}

export async function updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
  try {
    const { data: currentVideo } = await supabase
      .from('videos')
      .select('gallery_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('videos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Cache invalidálása
    if (currentVideo) {
      invalidateGalleryCache(currentVideo.gallery_id);
    }

    return data;
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
}

export async function deleteVideo(id: string): Promise<void> {
  try {
    const { data: video } = await supabase
      .from('videos')
      .select('gallery_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Cache invalidálása
    if (video) {
      invalidateGalleryCache(video.gallery_id);
    }
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

export async function getTagGroups(galleryId: string): Promise<TagGroup[]> {
  try {
    // Ellenőrizzük a cache-t
    const cached = tagGroupCache.get(galleryId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from('tag_groups')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('name');

    if (error) throw error;

    // Cache frissítése
    tagGroupCache.set(galleryId, {
      data: data || [],
      timestamp: Date.now()
    });

    return data || [];
  } catch (error) {
    console.error('Error fetching tag groups:', error);
    throw error;
  }
}

export async function addTagGroup(
  galleryId: string,
  name: string, 
  tags: string[] = []
): Promise<TagGroup> {
  try {
    const { data, error } = await supabase
      .from('tag_groups')
      .insert([{
        gallery_id: galleryId,
        name,
        tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Cache invalidálása
    invalidateGalleryCache(galleryId);

    return data;
  } catch (error) {
    console.error('Error adding tag group:', error);
    throw error;
  }
}

export async function updateTagGroup(id: string, updates: Partial<TagGroup>): Promise<TagGroup> {
  try {
    const { data: currentGroup } = await supabase
      .from('tag_groups')
      .select('gallery_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('tag_groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Cache invalidálása
    if (currentGroup) {
      invalidateGalleryCache(currentGroup.gallery_id);
    }

    return data;
  } catch (error) {
    console.error('Error updating tag group:', error);
    throw error;
  }
}

export async function deleteTagGroup(id: string): Promise<void> {
  try {
    const { data: group } = await supabase
      .from('tag_groups')
      .select('gallery_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('tag_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Cache invalidálása
    if (group) {
      invalidateGalleryCache(group.gallery_id);
    }
  } catch (error) {
    console.error('Error deleting tag group:', error);
    throw error;
  }
}