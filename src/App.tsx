// import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import MainPage from './components/dashboard/MainPage';
import CategoryGallery from './components/gallery/CategoryGallery';
import UploadPage from './components/dashboard/UploadPage';
import ManageVideosPage from './components/dashboard/ManageVideosPage';
import TagManagementPage from './components/dashboard/TagManagementPage';
import VideoPage from './components/gallery/VideoPage';
import RegistrationPage from './components/auth/RegistrationPage';
import LoginPage from './components/auth/LoginPage';
import AuthCallback from './components/auth/AuthCallback';
import DashboardPage from './components/dashboard/DashboardPage';
import CreateGallery from './components/dashboard/CreateGallery';
import GalleriesPage from './components/dashboard/GalleriesPage';
import SettingsPage from './components/dashboard/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Video, Gallery } from './lib/supabase-types';

function App() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      setSession(data.session);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch public galleries
        const { data: galleriesData, error: galleriesError } = await supabase
          .from('galleries')
          .select('*')
          .eq('visibility', 'public');

        if (galleriesError) {
          console.error('Error fetching galleries:', galleriesError);
          return;
        }

        // If user is logged in, fetch their private galleries too
        if (session) {
          const { data: privateGalleries, error: privateError } = await supabase
            .from('galleries')
            .select('*')
            .or(`visibility.in.(authenticated),and(visibility.eq.private,user_id.eq.${session.user.id})`);

          if (!privateError && privateGalleries) {
            galleriesData.push(...privateGalleries);
          }
        }

        setGalleries(galleriesData || []);


        // Get the IDs of visible galleries
        const galleryIds = galleriesData.map(g => g.id);

        // Fetch videos from visible galleries
        if (galleryIds.length > 0) {
          const { data: videosData, error: videosError } = await supabase
            .from('videos')
            .select(`
              *,
              galleries (
                id,
                name,
                visibility
              )
            `)
            .in('gallery_id', galleryIds);

          if (videosError) {
            console.error('Error fetching videos:', videosError);
            return;
          }

          setVideos(videosData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for video updates
    const handleVideoAdded = (event: CustomEvent) => {
      const { video } = event.detail;
      setVideos(prevVideos => [...prevVideos, video]);
    };

    const handleVideoUpdated = (event: CustomEvent) => {
      const { video } = event.detail;
      setVideos(prevVideos => prevVideos.map(v => 
        v.id === video.id ? video : v
      ));
    };

    const handleVideoDeleted = (event: CustomEvent) => {
      const { videoId } = event.detail;
      setVideos(prevVideos => prevVideos.filter(v => v.id !== videoId));
    };

    // Listen for gallery updates
    const handleGalleryCreated = (event: CustomEvent) => {
      const { gallery } = event.detail;
      setGalleries(prevGalleries => [...prevGalleries, gallery]);
    };

    const handleGalleryDeleted = (event: CustomEvent) => {
      const { galleryId } = event.detail;
      setGalleries(prevGalleries => prevGalleries.filter(g => g.id !== galleryId));
    };

    window.addEventListener('videoAdded', handleVideoAdded as EventListener);
    window.addEventListener('videoUpdated', handleVideoUpdated as EventListener);
    window.addEventListener('videoDeleted', handleVideoDeleted as EventListener);
    window.addEventListener('galleryCreated', handleGalleryCreated as EventListener);
    window.addEventListener('galleryDeleted', handleGalleryDeleted as EventListener);

    return () => {
      window.removeEventListener('videoAdded', handleVideoAdded as EventListener);
      window.removeEventListener('videoUpdated', handleVideoUpdated as EventListener);
      window.removeEventListener('videoDeleted', handleVideoDeleted as EventListener);
      window.removeEventListener('galleryCreated', handleGalleryCreated as EventListener);
      window.removeEventListener('galleryDeleted', handleGalleryDeleted as EventListener);
    };
  }, [session]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
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
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route index element={<MainPage galleries={galleries} videos={videos} />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/galleries" element={
              <ProtectedRoute>
                <GalleriesPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/galleries/create" element={
              <ProtectedRoute>
                <CreateGallery />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/galleries/:id/manage" element={
              <ProtectedRoute>
                <ManageVideosPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/galleries/:id/upload" element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/galleries/:id/tags" element={
              <ProtectedRoute>
                <TagManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            {/* Public Routes */}
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/gallery/:id" element={<CategoryGallery videos={videos} />} />
            <Route path="/video/:id" element={<VideoPage videos={videos} />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;