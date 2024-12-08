import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Play, Tag, Video } from 'lucide-react';
import { getGalleries, deleteGallery } from '../../services/gallery-service';
import { getVideos } from '../../services/video-service';
import { useAuth } from '../../lib/auth-context';
import type { Gallery } from '../../lib/supabase-types';
import Header from '../common/Header';

interface GalleryWithVideoCount extends Gallery {
  videoCount: number;
}

const GalleriesPage: React.FC = () => {
  const { user } = useAuth();
  const [galleries, setGalleries] = useState<GalleryWithVideoCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Galériák betöltése
  const loadGalleries = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    try {
      const galleriesData = await getGalleries(user.id, true);
      
      // Videók számának lekérése minden galériához
      const galleriesWithCounts = await Promise.all(
        galleriesData.map(async (gallery) => {
          const videos = await getVideos(gallery.id);
          return {
            ...gallery,
            videoCount: videos.length
          };
        })
      );
      
      setGalleries(galleriesWithCounts);
    } catch (err) {
      console.error('Error loading galleries:', err);
      setError('Failed to load galleries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleries();
  }, [user]);

  const handleDelete = async (galleryId: string) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;

    try {
      await deleteGallery(galleryId);
      setGalleries(galleries.filter(g => g.id !== galleryId));
      
      // Dispatch custom event for gallery deletion
      const event = new CustomEvent('galleryDeleted', {
        detail: { galleryId }
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Error deleting gallery:', err);
      setError('Failed to delete gallery');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header showManageButtons={true} />
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 animate-spin text-gray-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-4 text-lg text-gray-600">Loading galleries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showManageButtons={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza a Dashboard-ra
        </Link>

        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Galleries</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {galleries.length === 0 ? (
          <div className="rounded-lg bg-white shadow-md p-8 text-center">
            <p className="text-lg text-gray-600">
              You haven't created any galleries yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map(gallery => (
              <div
                key={gallery.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {gallery.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{gallery.description}</p>
                  
                  {/* Videók száma */}
                  <div className="flex items-center text-gray-500 mb-4">
                    <Video className="w-5 h-5 mr-2" />
                    <span>{gallery.videoCount} video{gallery.videoCount !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Link
                      to={`/gallery/${gallery.id}`}
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                      title="View Gallery"
                    >
                      <Play className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/dashboard/galleries/${gallery.id}/manage`}
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                      title="Manage Gallery"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/dashboard/galleries/${gallery.id}/tags`}
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                      title="Manage Tags"
                    >
                      <Tag className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(gallery.id)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      title="Delete Gallery"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleriesPage;
