/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import LoginForm from '../components/auth/LoginForm';

// Mock the auth context
jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockImplementation(() => ({
      signIn: jest.fn(),
      user: null,
      loading: false,
    }));
  });

  test('renders login form with all necessary fields', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Check if all form elements are present
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if validation errors are shown
    await waitFor(() => {
      const errors = screen.getAllByRole('alert');
      expect(errors).toHaveLength(2);
      expect(errors[0]).toHaveTextContent('Email is required');
      expect(errors[1]).toHaveTextContent('Password is required');
    });
  });

  test('shows error for invalid email format', async () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Enter invalid email
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'invalidemail' },
    });
    
    // Enter some password to avoid the required field error
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });

    // Try to submit
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if validation error is shown
    await waitFor(() => {
      const errors = screen.getAllByRole('alert');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveTextContent('Please enter a valid email');
    });
  });

  test('handles successful form submission', async () => {
    const mockSignIn = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockImplementation(() => ({
      signIn: mockSignIn,
      user: null,
      loading: false,
    }));

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Fill in form fields
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if signIn was called with correct values
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('toggles password visibility when clicking the eye icon', async () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByRole('button', { name: '' }); // Az Eye/EyeOff ikonok nem tartalmaznak szöveget

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle button again
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('shows loading state during sign in', async () => {
    // Mock signIn to be a slow operation
    const mockSignIn = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    (useAuth as jest.Mock).mockImplementation(() => ({
      signIn: mockSignIn,
      user: null,
      loading: false,
    }));

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Fill in form fields
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });

    // Get submit button by test ID
    const submitButton = screen.getByTestId('submit-button');

    // Submit form
    fireEvent.click(submitButton);

    // Loading spinner should appear (Loader2 component)
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      const spinner = submitButton.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent('Sign In');
    });
  });

  test('handles network error during sign in', async () => {
    // Mock signIn to throw a network error
    const mockSignIn = jest.fn(() => Promise.reject(new Error('Network error occurred')));
    (useAuth as jest.Mock).mockImplementation(() => ({
      signIn: mockSignIn,
      user: null,
      loading: false,
    }));

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Fill in form fields
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByTestId('submit-button'));

    // Error message should appear
    await waitFor(() => {
      const errors = screen.getAllByRole('alert');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveTextContent('An error occurred during login');
    });
  });

  test('handles invalid credentials error', async () => {
    // Mock signIn to throw an invalid credentials error
    const mockSignIn = jest.fn(() => Promise.reject(new Error('Invalid login credentials')));
    (useAuth as jest.Mock).mockImplementation(() => ({
      signIn: mockSignIn,
      user: null,
      loading: false,
    }));

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Fill in form fields
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wrongpassword' },
    });

    // Submit form
    fireEvent.click(screen.getByTestId('submit-button'));

    // Error message should appear
    await waitFor(() => {
      const errors = screen.getAllByRole('alert');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveTextContent('Invalid email or password');
    });
  });
});
