import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { getTagGroups } from '../../services/video-service';
import type { TagGroup } from '../../lib/supabase-types';

interface VideoUploadFormProps {
  onVideoUpload: (
    title: string,
    description: string,
    youtubeUrl: string,
    tags: { [key: string]: string[] }
  ) => void;
  galleryId: string;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onVideoUpload, galleryId }) => {
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>({});
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTagGroups = async () => {
      if (!galleryId) return;
      
      try {
        const data = await getTagGroups(galleryId);
        setTagGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tag groups');
      } finally {
        setLoading(false);
      }
    };

    loadTagGroups();
  }, [galleryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.length < 3 || title.length > 100) {
      setTitleError('Title must be between 3 and 100 characters');
      return;
    }

    if (description && description.length > 5000) {
      setDescriptionError('Description cannot be longer than 5000 characters');
      return;
    }

    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      alert('Invalid YouTube URL. Please enter a valid URL.');
      return;
    }

    onVideoUpload(
      title,
      description,
      videoId,
      selectedTags
    );
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (newTitle.length < 3) {
      setTitleError('Title must be at least 3 characters long');
    } else if (newTitle.length > 100) {
      setTitleError('Title cannot be longer than 100 characters');
    } else {
      setTitleError(null);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (newDescription.length > 5000) {
      setDescriptionError('Description cannot be longer than 5000 characters');
    } else {
      setDescriptionError(null);
    }
  };

  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleTagToggle = (group: string, tag: string) => {
    setSelectedTags(prevTags => {
      const updatedTags = { ...prevTags };
      if (!updatedTags[group]) {
        updatedTags[group] = [];
      }
      if (updatedTags[group].includes(tag)) {
        updatedTags[group] = updatedTags[group].filter(t => t !== tag);
        if (updatedTags[group].length === 0) {
          delete updatedTags[group];
        }
      } else {
        updatedTags[group] = [...updatedTags[group], tag];
      }
      return updatedTags;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold mb-4">Add New Video</h2>
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={handleTitleChange}
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            titleError ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        <div className="mt-1 flex justify-between">
          <span className={`text-sm ${titleError ? 'text-red-500' : 'text-gray-500'}`}>
            {titleError || `${title.length}/100 characters`}
          </span>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            descriptionError ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="mt-1 flex justify-between">
          <span className={`text-sm ${descriptionError ? 'text-red-500' : 'text-gray-500'}`}>
            {descriptionError || `${description.length}/5000 characters`}
          </span>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-1">
          YouTube URL
        </label>
        <input
          type="url"
          id="youtubeUrl"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Tags
        </label>
        <div className="space-y-4">
          {tagGroups.map((group) => (
            <div key={group.id} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">{group.name}</h4>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(group.name, tag)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                      selectedTags[group.name]?.includes(tag)
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center justify-center w-full sm:w-auto"
      >
        <PlusCircle className="mr-2" size={20} />
        Add Video
      </button>
    </form>
  );
};

export default VideoUploadForm;