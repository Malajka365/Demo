import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../../lib/auth-context';
import Header from '../Header';

// Mock useAuth hook
jest.mock('../../../lib/auth-context', () => ({
  useAuth: jest.fn()
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({ id: '123' })
}));

describe('Header Component', () => {
  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHeader = (props = {}) => {
    return render(
      <BrowserRouter>
        <Header {...props} />
      </BrowserRouter>
    );
  };

  describe('Gomb megjelenítési logika', () => {
    test('Nem bejelentkezett felhasználó esetén csak Register és Login gombok jelennek meg', () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      
      renderHeader();
      
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Upload')).not.toBeInTheDocument();
    });

    test('Bejelentkezett felhasználó esetén az alap gombok megjelennek', () => {
      (useAuth as jest.Mock).mockReturnValue({ 
        user: { email: 'test@test.com' },
        signOut: mockSignOut 
      });
      
      renderHeader();
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    test('Manage gombok csak akkor jelennek meg, ha showManageButtons=true és van id', () => {
      (useAuth as jest.Mock).mockReturnValue({ 
        user: { email: 'test@test.com' },
        signOut: mockSignOut 
      });
      
      // Először showManageButtons nélkül
      renderHeader();
      expect(screen.queryByText('Upload')).not.toBeInTheDocument();
      expect(screen.queryByText('Manage Videos')).not.toBeInTheDocument();
      expect(screen.queryByText('Manage Tags')).not.toBeInTheDocument();

      // Majd showManageButtons=true -val
      renderHeader({ showManageButtons: true });
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Manage Videos')).toBeInTheDocument();
      expect(screen.getByText('Manage Tags')).toBeInTheDocument();
    });

    test('Sign Out gomb működik', async () => {
      mockSignOut.mockResolvedValueOnce(undefined);
      (useAuth as jest.Mock).mockReturnValue({ 
        user: { email: 'test@test.com' },
        signOut: mockSignOut 
      });
      
      renderHeader();
      
      const signOutButton = screen.getByText('Sign Out');
      await fireEvent.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
