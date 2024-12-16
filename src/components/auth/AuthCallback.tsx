import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          throw error;
        }

        if (session) {
          // Várunk egy kicsit, hogy a trigger létrehozhassa a profilt
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Ellenőrizzük, hogy létezik-e már profil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Profile check error:', profileError);
            throw profileError;
          }

          // Ha nincs profil, megpróbáljuk létrehozni
          if (!profile) {
            const username = session.user.user_metadata.name 
              ? session.user.user_metadata.name.toLowerCase().replace(/\s+/g, '_')
              : `user_${session.user.id.slice(0, 8)}`;

            const { error: createError } = await supabase
              .from('profiles')
              .upsert([
                {
                  id: session.user.id,
                  username,
                  avatar_url: session.user.user_metadata.avatar_url,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ], { onConflict: 'id' });

            if (createError) {
              console.error('Profile creation error:', createError);
              throw createError;
            }

            // Várunk egy kicsit, hogy a profil biztosan létrejöjjön
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Sikeres bejelentkezés, átirányítás a főoldalra
          navigate('/', { replace: true });
        } else {
          // Ha nincs session, visszairányítás a login oldalra
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default AuthCallback;
