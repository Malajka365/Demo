import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TagFilterProps {
  tagGroups: TagGroup[];
  activeTags: { [key: string]: string[] };
  onTagToggle: (group: string, tagName: string) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ tagGroups, activeTags, onTagToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Csak az első címkecsoportot használjuk, mivel most minden csoport külön komponensként jelenik meg
  const group = tagGroups[0];
  if (!group) return null;

  const activeTagsInGroup = activeTags[group.name] || [];

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-between items-center w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="mr-2">{group.name}</span>
          {activeTagsInGroup.length > 0 && (
            <span className="bg-blue-100 text-blue-600 rounded-full px-2 py-1 text-xs font-semibold mr-2">
              {activeTagsInGroup.length}
            </span>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Lenyíló menü */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {group.tags.map((tag) => (
              <label
                key={tag}
                className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeTagsInGroup.includes(tag)}
                  onChange={() => onTagToggle(group.name, tag)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;