import React, { useState, useEffect } from 'react';
import { Link, useParams,  } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { TagGroup } from '../../lib/supabase-types';
import { getTagGroups, addTagGroup, updateTagGroup, deleteTagGroup } from '../../services/video-service';
import { getGallery } from '../../services/gallery-service';
import Header from '../common/Header';

const TagManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // const [searchParams] = useSearchParams();
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [galleryName, setGalleryName] = useState<string>('');
  const [newGroup, setNewGroup] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadGalleryAndTags();
  }, [id]);

  const loadGalleryAndTags = async () => {
    try {
      const [galleryData, tagsData] = await Promise.all([
        getGallery(id!),
        getTagGroups(id!)
      ]);
      
      if (galleryData) {
        setGalleryName(galleryData.name);
      }
      setTagGroups(tagsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (newGroup && id) {
      try {
        const newTagGroup = await addTagGroup(id, newGroup);
        setTagGroups([...tagGroups, newTagGroup]);
        setNewGroup('');
        setSelectedGroup(newTagGroup.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to add tag group');
      }
    }
  };

  const handleAddTag = async () => {
    if (selectedGroup && newTag) {
      try {
        const group = tagGroups.find(g => g.id === selectedGroup);
        if (!group) return;

        const updatedTags = [...group.tags, newTag];
        const updatedGroup = await updateTagGroup(selectedGroup, { tags: updatedTags });
        
        setTagGroups(tagGroups.map(g => 
          g.id === selectedGroup ? updatedGroup : g
        ));
        setNewTag('');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to add tag');
      }
    }
  };

  const handleRemoveTag = async (groupId: string, tagToRemove: string) => {
    if (!window.confirm(`Biztosan törölni szeretnéd a "${tagToRemove}" címkét?`)) return;

    try {
      const group = tagGroups.find(g => g.id === groupId);
      if (!group) return;

      const updatedTags = group.tags.filter(tag => tag !== tagToRemove);
      const updatedGroup = await updateTagGroup(groupId, { tags: updatedTags });
      
      setTagGroups(tagGroups.map(g => 
        g.id === groupId ? updatedGroup : g
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove tag');
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    const group = tagGroups.find(g => g.id === groupId);
    if (!group || !id) return;

    if (!window.confirm(`Biztosan törölni szeretnéd a "${group.name}" címke csoportot és az összes benne lévő címkét?`)) return;
    
    try {
      await deleteTagGroup(groupId);
      setTagGroups(tagGroups.filter(g => g.id !== groupId));
      if (selectedGroup === groupId) {
        setSelectedGroup('');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove group');
    }
  };

  // Create back link URL with preserved filters
  // const backToGalleryUrl = `/gallery/${id}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header showManageButtons={true} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header showManageButtons={true} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showManageButtons={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link 
            to="/dashboard/galleries"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Galleries
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Tags - {galleryName}
          </h1>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Add New Tag Group</h2>
          <div className="flex">
            <input
              type="text"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="Enter new group name"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md"
            />
            <button
              onClick={handleAddGroup}
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Add New Tag</h2>
          <div className="flex mb-2">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md"
            >
              <option value="">Select a group</option>
              {tagGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter new tag"
              className="flex-grow px-3 py-2 border-t border-b border-gray-300"
            />
            <button
              onClick={handleAddTag}
              disabled={!selectedGroup || !newTag}
              className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 disabled:bg-gray-400"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Existing Tags</h2>
          {tagGroups.map((group) => (
            <div key={group.id} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">{group.name}</h3>
                <button
                  onClick={() => handleRemoveGroup(group.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(group.id, tag)}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagManagementPage;