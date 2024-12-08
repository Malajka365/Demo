import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import VideoUploadForm from '../video/VideoUploadForm';
import { ArrowLeft } from 'lucide-react';
import { addVideo } from '../../services/video-service';
import { getGallery } from '../../services/gallery-service';
import { useAuth } from '../../lib/auth-context';
import Header from '../common/Header';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [galleryName, setGalleryName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadGallery();
  }, [id]);

  const loadGallery = async () => {
    try {
      const galleryData = await getGallery(id!);
      if (galleryData) {
        setGalleryName(galleryData.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (
    title: string,
    description: string,
    videoId: string,
    tags: { [key: string]: string[] }
  ) => {
    if (!id) {
      alert('Gallery ID is required');
      return;
    }

    if (!user) {
      alert('You must be logged in to upload videos');
      return;
    }

    try {
      await addVideo(id, title, description, videoId, tags);
      // Navigate back to the gallery view
      navigate(`/gallery/${id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload video');
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header showManageButtons={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-red-500">Error: Gallery ID is required</div>
          <Link to="/dashboard/galleries" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
            <ArrowLeft className="inline mr-2" size={20} />
            Back to Galleries
          </Link>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header showManageButtons={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-gray-500">Loading gallery...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header showManageButtons={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-red-500">{error}</div>
          <Link to="/dashboard/galleries" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
            <ArrowLeft className="inline mr-2" size={20} />
            Back to Galleries
          </Link>
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
            Upload Video - {galleryName}
          </h1>
        </div>

        <VideoUploadForm onVideoUpload={handleVideoUpload} galleryId={id} />
      </div>
    </div>
  );
};

export default UploadPage;