import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Search,  Eye, EyeOff,  } from 'lucide-react';
import VideoCard from '../video/VideoCard';
import TagFilter from '../common/TagFilter';
import { Video, TagGroup, Gallery } from '../../lib/supabase-types';
import { getTagGroups } from '../../services/video-service';
import { getGalleries } from '../../services/gallery-service';
import { useAuth } from '../../lib/auth-context';
import Header from '../common/Header';

// const VIDEOS_PER_PAGE_OPTIONS = [20, 50, 100];

interface CategoryGalleryProps {
  videos: Video[];
}

const CategoryGallery: React.FC<CategoryGalleryProps> = ({ videos: allVideos }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [videosPerPage, setVideosPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTags, setActiveTags] = useState<{ [key: string]: string[] }>(() => {
    try {
      const tagsParam = searchParams.get('tags');
      return tagsParam ? JSON.parse(decodeURIComponent(tagsParam)) : {};
    } catch {
      return {};
    }
  });
  
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');

  const [windowFocused, setWindowFocused] = useState(true);

  useEffect(() => {
    const onFocus = () => setWindowFocused(true);
    const onBlur = () => setWindowFocused(false);

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tagGroupsData, galleriesData] = await Promise.all([
        getTagGroups(id!),
        getGalleries(user?.id)
      ]);

      setTagGroups(tagGroupsData);
      const galleryData = galleriesData.find(g => g.id === id);
      setGallery(galleryData || null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (windowFocused && id) {
      loadData();
    }
  }, [windowFocused, id]);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    
    loadData();
  }, [id]);

  // Filter videos by gallery ID
  const videos = allVideos.filter(video => video.gallery_id === id);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    if (Object.keys(activeTags).length > 0) {
      params.set('tags', encodeURIComponent(JSON.stringify(activeTags)));
    } else {
      params.delete('tags');
    }
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, activeTags, setSearchParams]);

  const handleTagToggle = (group: string, tagName: string) => {
    setActiveTags(prevTags => {
      const updatedTags = { ...prevTags };
      if (!updatedTags[group]) {
        updatedTags[group] = [];
      }
      
      const tagIndex = updatedTags[group].indexOf(tagName);
      if (tagIndex > -1) {
        updatedTags[group] = updatedTags[group].filter(t => t !== tagName);
        if (updatedTags[group].length === 0) {
          delete updatedTags[group];
        }
      } else {
        updatedTags[group] = [...updatedTags[group], tagName];
      }
      return updatedTags;
    });
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleVideosPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVideosPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveTags({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredVideos = videos.filter((video) => {
    const matchesTags = Object.entries(activeTags).every(([group, tags]) => {
      if (tags.length === 0) return true;
      return video.tags && 
             typeof video.tags === 'object' && 
             video.tags[group] && 
             Array.isArray(video.tags[group]) && 
             tags.every(tag => video.tags[group].includes(tag));
    });
    
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTags && matchesSearch;
  });

  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
  const startIndex = (currentPage - 1) * videosPerPage;
  const endIndex = startIndex + videosPerPage;
  const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header  showManageButtons={true} />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {gallery?.name || 'Loading...'}
                </h1>
                {gallery && (
                  <div className="flex items-center text-sm text-gray-500">
                    {gallery.visibility === 'private' ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {gallery.visibility.charAt(0).toUpperCase() + gallery.visibility.slice(1)}
                  </div>
                )}
              </div>
              {gallery?.description && (
                <p className="text-gray-600">{gallery.description}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* Keresés és lapozás */}
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Clear All Filters
                  </button>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="videos-per-page" className="text-sm">Videos per page:</label>
                    <select 
                      id="videos-per-page" 
                      value={videosPerPage} 
                      onChange={handleVideosPerPageChange} 
                      className="border rounded px-2 py-1"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={36}>36</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tag szűrők */}
              <div className="flex flex-wrap gap-4 mb-8">
                {tagGroups?.map((group) => (
                  <div key={group.id} className="flex-none">
                    <TagFilter
                      tagGroups={[group]}
                      activeTags={activeTags}
                      onTagToggle={handleTagToggle}
                    />
                  </div>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading videos...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-600">No videos found.</p>
              </div>
            ) : (
              <div>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg bg-white shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg bg-white shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CategoryGallery;