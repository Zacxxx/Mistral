"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Auth } from 'aws-amplify';
import { CognitoUser } from '@aws-amplify/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setUser(user);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const user = await Auth.signIn(email, password);
    setUser(user);
    router.push('/');
  };

  const signUp = async (email: string, password: string, name: string) => {
    await Auth.signUp({
      username: email,
      password,
      attributes: {
        email,
        name,
      },
    });
  };

  const confirmSignUp = async (email: string, code: string) => {
    await Auth.confirmSignUp(email, code);
    router.push('/login');
  };

  const signOut = async () => {
    await Auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    await Auth.forgotPassword(email);
  };

  const confirmPassword = async (email: string, code: string, newPassword: string) => {
    await Auth.forgotPasswordSubmit(email, code, newPassword);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={
        {
          user,
          isAuthenticated: !!user,
          isLoading,
          signIn,
          signUp,
          confirmSignUp,
          signOut,
          resetPassword,
          confirmPassword,
        }
      }
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);