import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Key, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import Header from '../common/Header';

const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form állapotok
  const [username, setUsername] = useState(profile?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  // const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatarUrl(profile.avatar_url || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  // Profil frissítése
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile({
        username,
        avatar_url: avatarUrl,
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Error updating profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Jelszó változtatás
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Password changed successfully!');
      // setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Error changing password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Avatar feltöltés
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      // Fájl feltöltése a storage-ba
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Avatar URL frissítése
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      await updateProfile({ avatar_url: data.publicUrl });
      setSuccess('Avatar updated successfully!');
    } catch (err) {
      setError('Error uploading avatar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showManageButtons={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-md">
              {success}
            </div>
          )}

          {/* Profile settings */}
          <form onSubmit={handleUpdateProfile} className="space-y-6 mb-8">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                <User className="w-4 h-4 inline-block mr-2" />
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4 inline-block mr-2" />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">
                To change your email address, please contact the administrator.
              </p>
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                Profile Picture
              </label>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="mt-2 w-20 h-20 rounded-full object-cover"
                />
              )}
              <div className="mt-2">
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="sr-only"
                  />
                  Choose File
                </label>
                <span className="ml-3 text-sm text-gray-500">
                  {avatarUrl ? 'File selected' : 'No file selected'}
                </span>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </button>
            </div>
          </form>

          {/* Password change */}
          <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                <Key className="w-4 h-4 inline-block mr-2" />
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                <Key className="w-4 h-4 inline-block mr-2" />
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Change Password
              </button>
            </div>
          </form>

          {/* Sign out */}
          <div className="mt-8">
            <button
              onClick={signOut}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
