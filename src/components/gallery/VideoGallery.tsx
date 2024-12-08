import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Upload, Settings, Tags } from 'lucide-react';
import VideoCard from '../video/VideoCard';
import TagFilter from '../common/TagFilter';
import { Video, TagGroup } from '../../lib/supabase-types';
import { getVideos, getTagGroups } from '../../services/video-service';
import { isGalleryOwner } from '../../services/gallery-service';
import { useAuth } from '../../lib/auth-context';
import Header from '../common/Header';

const VideoGallery: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [activeTags, setActiveTags] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      if (user && id) {
        try {
          const isOwnerResult = await isGalleryOwner(id, user.id);
          console.log('isOwnerResult:', isOwnerResult, 'for gallery:', id, 'user:', user.id);
          setIsOwner(isOwnerResult);
        } catch (err) {
          console.error('Error checking gallery ownership:', err);
          setIsOwner(false);
        }
      } else {
        setIsOwner(false);
      }
    };

    checkOwnership();
  }, [id, user]);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        const [videosData, tagGroupsData] = await Promise.all([
          getVideos(id),
          getTagGroups(id)
        ]);
        setVideos(videosData);
        setTagGroups(tagGroupsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const handleTagToggle = (group: string, tagName: string) => {
    setActiveTags(prevTags => {
      const updatedTags = { ...prevTags };
      if (!updatedTags[group]) {
        updatedTags[group] = [];
      }
      if (updatedTags[group].includes(tagName)) {
        updatedTags[group] = updatedTags[group].filter(tag => tag !== tagName);
      } else {
        updatedTags[group] = [...updatedTags[group], tagName];
      }
      return updatedTags;
    });
  };

  const filteredVideos = videos.filter((video) => {
    return Object.entries(activeTags).every(([group, tags]) => {
      return tags.every(tag => 
        Array.isArray(video.tags[group]) && video.tags[group].includes(tag)
      );
    });
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Header showManageButtons={false} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Header showManageButtons={false} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Header showManageButtons={isOwner} />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <Link to="/" className="text-blue-500 hover:text-blue-600 mb-2 inline-block">
              ← Back to Galleries
            </Link>
            <h1 className="text-3xl font-bold capitalize">{id} Videos</h1>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            {isOwner && (
              <Link
                to={`/dashboard/galleries/${id}/upload`}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
              >
                <Upload className="mr-2" size={20} />
                Upload Video
              </Link>
            )}
            {isOwner && (
              <Link
                to={`/${id}/manage`}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center"
              >
                <Settings className="mr-2" size={20} />
                Manage
              </Link>
            )}
            <Link
              to={`/${id}/tags`}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center"
            >
              <Tags className="mr-2" size={20} />
              Tags
            </Link>
          </div>
        </div>

        <TagFilter 
          tagGroups={tagGroups} 
          activeTags={activeTags} 
          onTagToggle={handleTagToggle} 
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <p className="text-center text-gray-500 mt-8">
            No videos found. Try adjusting your filters or add some videos.
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoGallery;