import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Signup from './Signup';

describe('Auth Features', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByText('Sign in to BuildShield')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('validates login form', async () => {
    const user = userEvent.setup();
    render(<Login />);
    const submitButton = screen.getByText('Sign In');
    await user.click(submitButton);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('renders signup form', () => {
    render(<Signup />);
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  });

  it('handles authentication state', () => {
    const TestComponent = () => {
      const { user, isAuthenticated } = useAuth();
      return <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>;
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
  });
});