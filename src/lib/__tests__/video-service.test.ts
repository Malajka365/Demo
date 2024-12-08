import { supabase } from '../supabase';
import { addVideo, getVideos, updateVideo, deleteVideo } from '../../services/video-service';
import { Video } from '../supabase-types';

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
      order: jest.fn()
    }))
  }
}));

describe('Video Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVideos', () => {
    it('should fetch videos for a category', async () => {
      const mockVideos: Video[] = [
        {
          id: '1',
          gallery_id:"1",
          user_id: 'user1',
          title: 'Test Video 1',
          description: 'Test Description 1',
          youtube_id: 'yt1',
          category: 'handball',
          tags: {},
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'user1',
          gallery_id:"2",
          title: 'Test Video 2',
          description: 'Test Description 2',
          youtube_id: 'yt2',
          category: 'handball',
          tags: {},
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const mockSupabase = supabase.from as jest.Mock;
      mockSupabase().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockVideos, error: null })
        })
      });

      const result = await getVideos('handball');

      expect(result).toEqual(mockVideos);
      expect(mockSupabase).toHaveBeenCalledWith('videos');
      expect(mockSupabase().select).toHaveBeenCalledWith('*');
    });

    it('should handle errors when fetching videos', async () => {
      const mockError = new Error('Database error');
      const mockSupabase = supabase.from as jest.Mock;
      mockSupabase().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: mockError })
        })
      });

      await expect(getVideos('handball')).rejects.toThrow('Database error');
    });
  });

  describe('addVideo', () => {
    it('should add a new video successfully', async () => {
      const mockVideo: Video = {
        id: '1',
        gallery_id:"1",
        user_id: 'user1',
        title: 'New Video',
        description: 'Test description',
        youtube_id: 'abc123',
        tags: { category: ['tag1', 'tag2'] },
        category: 'handball',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockSupabase = supabase.from as jest.Mock;
      mockSupabase().insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockVideo, error: null })
        })
      });

      const result = await addVideo(
        'handball',
        'New Video',
        'Test description',
        'abc123',
        { category: ['tag1', 'tag2'] },
       
      ); 

      expect(result).toEqual(mockVideo);
      expect(mockSupabase).toHaveBeenCalledWith('videos');
      expect(mockSupabase().insert).toHaveBeenCalledWith([{
        title: 'New Video',
        description: 'Test description',
        youtube_id: 'abc123',
        tags: { category: ['tag1', 'tag2'] },
        category: 'handball',
        is_public: true
      }]);
    });

    it('should handle errors when adding a video', async () => {
      const mockError = new Error('Insert failed');
      const mockSupabase = supabase.from as jest.Mock;
      mockSupabase().insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: mockError })
        })
      });

      await expect(addVideo(
        'handball',
        'New Video',
        'Test description',
        'abc123',
        {},
    
      )).rejects.toThrow('Insert failed');
    });
  });

  describe('updateVideo', () => {
    it('should update a video successfully', async () => {
      const mockVideo: Video = {
        id: '1',
        user_id: 'user1',
        gallery_id:"1",
        title: 'Updated Video',
        description: 'Updated description',
        youtube_id: 'abc123',
        tags: { category: ['tag1', 'tag2'] },
        category: 'handball',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockSupabase = supabase.from as jest.Mock;
      mockSupabase().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockVideo, error: null })
          })
        })
      });

      const updates = {
        title: 'Updated Video',
        description: 'Updated description'
      };

      const result = await updateVideo('1', updates);

      expect(result).toEqual(mockVideo);
      expect(mockSupabase).toHaveBeenCalledWith('videos');
      expect(mockSupabase().update).toHaveBeenCalledWith(updates);
    });
  });

  describe('deleteVideo', () => {
    it('should delete a video successfully', async () => {
      const mockSupabase = supabase.from as jest.Mock;
      mockSupabase().delete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await expect(deleteVideo('1')).resolves.not.toThrow();
      expect(mockSupabase).toHaveBeenCalledWith('videos');
      expect(mockSupabase().delete).toHaveBeenCalled();
    });

    it('should handle errors when deleting a video', async () => {
      const mockError = new Error('Delete failed');
      const mockSupabase = supabase.from as jest.Mock;
      mockSupabase().delete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: mockError })
      });

      await expect(deleteVideo('1')).rejects.toThrow('Delete failed');
    });
  });
});
