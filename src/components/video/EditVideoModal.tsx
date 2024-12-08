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
  const [description, setDescription] = useState(video.description || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Edit Video</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
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
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVideoModal;