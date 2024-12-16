import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, Settings, LogOut, LogIn, Video as VideoIcon, Upload, Tags, LayoutDashboard, Film } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  showManageButtons?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showManageButtons = false }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [isGalleryOwner, setIsGalleryOwner] = useState(false);

  useEffect(() => {
    const checkGalleryOwnership = async () => {
      if (id && user) {
        try {
          const { data: gallery, error } = await supabase
            .from('galleries')
            .select('user_id')
            .eq('id', id)
            .single();

          if (error) {
            console.error('Error checking gallery ownership:', error);
            return;
          }

          setIsGalleryOwner(gallery?.user_id === user.id);
        } catch (err) {
          console.error('Error checking gallery ownership:', err);
        }
      } else {
        setIsGalleryOwner(false);
      }
    };

    checkGalleryOwnership();
  }, [id, user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const showGalleryControls = showManageButtons && isGalleryOwner;

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <VideoIcon className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-2xl font-bold text-gray-900">Video Gallery</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Home gomb mindenkinek */}
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </button>

            {!user ? (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </button>
            ) : (
              <>
                {/* További gombok bejelentkezett felhasználóknak */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1" />
                    Dashboard
                  </button>
                </div>

                {showGalleryControls && (
                  <>
                    <button
                      onClick={() => navigate(`/dashboard/galleries/${id}/upload`)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/galleries/${id}/manage`)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Film className="w-4 h-4 mr-1" />
                      Manage
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/galleries/${id}/tags`)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Tags className="w-4 h-4 mr-1" />
                      Tags
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate('/dashboard/settings')}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
