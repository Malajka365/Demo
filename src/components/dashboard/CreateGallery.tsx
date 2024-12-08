import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { addGallery } from '../../services/gallery-service';
import { useAuth } from '../../lib/auth-context';
import { GalleryCategory } from '../../lib/supabase-types';
import Header from '../common/Header';

interface GalleryInput {
  name: string;
  description: string;
  visibility: 'public' | 'private' | 'authenticated';
  category: GalleryCategory;
}

const CreateGallery: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<GalleryInput>({
    name: '',
    description: '',
    visibility: 'public',
    category: 'handball'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      const newGallery = await addGallery(
        user.id,
        formData.name,
        formData.description,
        formData.visibility,
        formData.category
      );
      
      // Dispatch custom event for gallery creation
      const event = new CustomEvent('galleryCreated', {
        detail: { gallery: newGallery }
      });
      window.dispatchEvent(event);
      
      navigate('/dashboard/galleries');
    } catch (error: any) {
      console.error('Error creating gallery:', error);
      let errorMessage = 'Failed to create gallery';
      
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      if (error.details) {
        errorMessage += ` (${error.details})`;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showManageButtons={true} />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza a Dashboard-ra
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Gallery</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-md">
            <div className="mb-4">
              <label className="mb-2 block font-medium text-gray-700">
                Gallery Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full rounded-lg border p-2 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter gallery name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="mb-2 block font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full rounded-lg border p-2 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="Enter gallery description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="mb-2 block font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full rounded-lg border p-2 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="handball">Handball</option>
                <option value="Physical">Physical</option>
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="sports">Any Sports</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="mb-2 block font-medium text-gray-700">
                Visibility
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 p-2"
              >
                <option value="public">Public</option>
                <option value="authenticated">Authenticated Users Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            {errors.submit && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {errors.submit}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Link
                to="/dashboard/galleries"
                className="mr-4 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isLoading ? 'Creating...' : 'Create Gallery'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGallery;
