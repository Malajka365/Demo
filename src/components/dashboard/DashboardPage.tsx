import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { FolderPlus, Settings, Library, Loader2 } from 'lucide-react';
import Header from '../common/Header';

const DashboardPage: React.FC = () => {
  const { user, loading, refreshAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Csak akkor frissítjük a session-t, ha nincs user
    const checkSession = async () => {
      if (!user) {
        try {
          await refreshAuth();
        } catch (error) {
          console.error('Error refreshing session:', error);
          navigate('/login');
        }
      }
    };
    
    checkSession();
  }, [refreshAuth, navigate, user]);

 
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showManageButtons={true} />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/dashboard/galleries"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-8">
              <Library className="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">My Galleries</h3>
              <p className="mt-2 text-gray-600">View and manage your video galleries</p>
            </div>
          </Link>

          <Link
            to="/dashboard/galleries/create"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-8">
              <FolderPlus className="w-12 h-12 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Create Gallery</h3>
              <p className="mt-2 text-gray-600">Create a new video gallery</p>
            </div>
          </Link>

          <Link
            to="/dashboard/settings"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-8">
              <Settings className="w-12 h-12 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Settings</h3>
              <p className="mt-2 text-gray-600">Manage your account settings</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;