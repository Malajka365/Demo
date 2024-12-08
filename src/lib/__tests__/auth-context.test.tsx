import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';
import { supabase } from '../supabase';
import { Profile } from '../supabase-types';

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
      maybeSingle: jest.fn()
    }))
  }
}));

// Test component that uses auth context
const TestComponent = () => {
  const { user, signIn, signOut, loading } = useAuth();
  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div data-testid="user-status">
            {user ? 'Logged in' : 'Not logged in'}
          </div>
          <button onClick={() => signIn('test@example.com', 'password')}>
            Sign In
          </button>
          <button onClick={() => signOut()}>
            Sign Out
          </button>
        </>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock initial session state
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });
  });

  it('should show loading state initially', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should handle successful sign in', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser };
    const mockProfile: Profile = {
      id: '123',
      username: 'testuser',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Mock successful sign in
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // Mock session refresh after sign in
    (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // Mock profile fetch
    (supabase.from as jest.Mock)().select.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click sign in button
    await act(async () => {
      fireEvent.click(screen.getByText('Sign In'));
    });

    // Verify sign in was called
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });

    // Wait for profile to be loaded and status to update
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in');
    });
  });

  it('should handle sign in error', async () => {
    // Mock sign in error
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid credentials' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click sign in button
    await act(async () => {
      fireEvent.click(screen.getByText('Sign In'));
    });

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  it('should handle sign out', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser };

    // Mock initial logged in state
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // Mock successful sign out
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click sign out button
    await act(async () => {
      fireEvent.click(screen.getByText('Sign Out'));
    });

    // Verify sign out was called
    expect(supabase.auth.signOut).toHaveBeenCalled();

    // Wait for status to update
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });
});
