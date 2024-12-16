import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Profile } from './supabase-types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastProfileFetch, setLastProfileFetch] = useState<number>(0);

  // Profile lekérése (rate limiting-gel)
  const fetchProfile = useCallback(async (userId: string) => {
    const now = Date.now();
    // Rate limiting check
    if (now - lastProfileFetch < 60000) {
      console.log('Skipping profile fetch due to rate limiting');
      return profile;
    }

    try {
      console.log('Fetching profile for user:', userId);
      setLastProfileFetch(now);
      
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }

      // If profile exists, return it
      if (data) {
        return data;
      }

      // If no profile exists, create one
      console.log('No profile found, creating new profile');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            username: 'user_' + userId.slice(0, 8),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError.message);
        // Check if error is due to unique constraint on username
        if (createError.message.includes('unique constraint')) {
          // Try again with a random suffix
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const { data: retryProfile, error: retryError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                username: 'user_' + randomSuffix,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (retryError) {
            console.error('Error in retry create profile:', retryError.message);
            return null;
          }

          return retryProfile;
        }
        return null;
      }

      return newProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, [profile, lastProfileFetch]);

  // Session frissítése (rate limiting-gel)
  const refreshAuth = useCallback(async () => {
    const now = Date.now();
    // Csak akkor frissítjük a session-t, ha az utolsó frissítés óta legalább 1 perc eltelt
    if (now - lastProfileFetch < 60000) {
      console.log('Skipping session refresh due to rate limiting');
      return;
    }

    try {
      console.log('Manually refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error.message);
        setUser(null);
        setProfile(null);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        const newProfile = await fetchProfile(session.user.id);
        if (newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error in refreshAuth:', error);
      throw error;
    }
  }, [fetchProfile, lastProfileFetch]);

  // Kezdeti betöltés és auth state változások figyelése
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          return;
        }

        if (mounted && session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Auth változások figyelése
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            const profileData = await fetchProfile(session.user.id);
            if (mounted && profileData) {
              setProfile(profileData);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Token frissítés figyelése
  useEffect(() => {
    let mounted = true;
    let tokenRefreshInterval: NodeJS.Timeout;

    const setupTokenRefresh = () => {
      // Token frissítése 30 percenként
      tokenRefreshInterval = setInterval(async () => {
        if (mounted && user) {
          const session = await supabase.auth.getSession();
          const expiresAt = session.data.session?.expires_at;
          
          // Csak akkor frissítjük a tokent, ha 30 percen belül lejár
          if (expiresAt && (expiresAt * 1000 - Date.now() < 30 * 60 * 1000)) {
            console.log('Token expires soon, refreshing...');
            try {
              const { data: { session }, error } = await supabase.auth.refreshSession();
              if (error) {
                console.error('Token refresh error:', error);
                if (mounted) {
                  setUser(null);
                  setProfile(null);
                }
                return;
              }

              if (!session) {
                console.log('No valid session found during token refresh');
                if (mounted) {
                  setUser(null);
                  setProfile(null);
                }
                return;
              }

              if (mounted) {
                setUser(session.user);
              }
            } catch (error) {
              console.error('Error in token refresh:', error);
            }
          }
        }
      }, 30 * 60 * 1000); // 30 perc
    };

    if (user) {
      setupTokenRefresh();
    }

    return () => {
      mounted = false;
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      // First try to check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // Create profile immediately instead of waiting for trigger
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // If profile creation fails, try to delete the auth user
          await supabase.auth.admin.deleteUser(data.user.id);
          throw new Error('Failed to create user profile');
        }

        // Fetch the newly created profile
        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      updateProfile,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}