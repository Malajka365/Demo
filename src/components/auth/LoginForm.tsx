import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import FormInput from './FormInput';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Ha már be van jelentkezve, átirányítjuk
  useEffect(() => {
    if (user && !authLoading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signIn(formData.email, formData.password);
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred during login';
      
      // Részletesebb Supabase hibakezelés
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('Email not confirmed')) {
      } else if (error.message?.includes('Too many requests')) {
      } else if (error.message?.includes('Network')) {
      } else if (error.message?.includes('User not found')) {
      }
      
      setErrors({
        submit: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Töröljük a hibaüzenetet amikor a felhasználó módosít egy mezőt
    setErrors(prev => ({
      ...prev,
      [name]: '',
      submit: '' // Töröljük az általános hibaüzenetet is
    }));
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormInput
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        icon={<Mail className="w-5 h-5 text-gray-400" />}
        placeholder="Enter your email"
        disabled={isLoading}
      />

      <FormInput
        label="Password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        icon={<Lock className="w-5 h-5 text-gray-400" />}
        placeholder="Enter your password"
        disabled={isLoading}
        endIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="focus:outline-none"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        }
      />

      {errors.submit && (
        <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
          {errors.submit}
        </div>
      )}

      <div className="flex items-center justify-end">
        <Link 
          to="/forgot-password" 
          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          tabIndex={isLoading ? -1 : 0}
        >
          Forgot your password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        data-testid="submit-button"
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          'Sign In'
        )}
      </button>

      <div className="text-center text-sm">
        <span className="text-gray-600">Don't have an account? </span>
        <Link 
          to="/register" 
          className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          tabIndex={isLoading ? -1 : 0}
        >
          Sign up
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;