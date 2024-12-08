import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, refreshAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      if (!user && !loading) {
        try {
          await refreshAuth();
        } catch (error) {
          console.error('Error refreshing session in ProtectedRoute:', error);
        }
      }
    };

    checkSession();
  }, [user, loading, refreshAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    // Mentjük az eredeti céloldalt, hogy bejelentkezés után oda irányíthassunk
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;