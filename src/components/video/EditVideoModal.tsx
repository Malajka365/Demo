import React, { useState, useEffect } from 'react';
import { Video, TagGroup } from '../../lib/supabase-types';
import { X } from 'lucide-react';
import { updateVideo, getTagGroups } from '../../services/video-service';

interface EditVideoModalProps {
  video: Video;
  onSave: (updatedVideo: Video) => void;
  onClose: () => void;
}

const EditVideoModal: React.FC<EditVideoModalProps> = ({ video, onSave, onClose }) => {
  const [title, setTitle] = useState(video.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [description, setDescription] = useState(video.description || '');
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [tags, setTags] = useState<{ [key: string]: string[] }>(video.tags);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTagGroups = async () => {
      try {
        const data = await getTagGroups(video.gallery_id);
        setTagGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tag groups');
      } finally {
        setLoading(false);
      }
    };

    loadTagGroups();
  }, [video.gallery_id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title
    if (title.length < 3 || title.length > 100) {
      setTitleError('Title must be between 3 and 100 characters');
      return;
    }

    // Validate description
    if (description && description.length > 5000) {
      setDescriptionError('Description cannot be longer than 5000 characters');
      return;
    }

    try {
      const updatedVideo = await updateVideo(video.id, { title, description, tags });
      onSave(updatedVideo);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update video');
    }
  };

  const handleTagToggle = (groupName: string, tag: string) => {
    setTags(prevTags => {
      const updatedTags = { ...prevTags };
      if (!updatedTags[groupName]) {
        updatedTags[groupName] = [];
      }
      if (updatedTags[groupName].includes(tag)) {
        updatedTags[groupName] = updatedTags[groupName].filter(t => t !== tag);
      } else {
        updatedTags[groupName] = [...updatedTags[groupName], tag];
      }
      return updatedTags;
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Edit Video</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  titleError ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {titleError && (
                <p className="mt-1 text-sm text-red-500">{titleError}</p>
              )}
              <div className="mt-1 text-sm text-gray-500">
                {title.length}/100 characters
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                rows={4}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  descriptionError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {descriptionError && (
                <p className="mt-1 text-sm text-red-500">{descriptionError}</p>
              )}
              <div className="mt-1 text-sm text-gray-500">
                {description.length}/5000 characters
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
              <div className="space-y-4">
                {tagGroups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-md p-4">
                    <h4 className="font-medium mb-2">{group.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(group.name, tag)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            tags[group.name]?.includes(tag)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          </form>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={titleError || descriptionError}
              className={`px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 ${
                titleError || descriptionError ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVideoModal;