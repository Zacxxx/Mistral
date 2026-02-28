"use client"

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword
} from 'aws-amplify/auth';
import type { AuthUser as AuthUserType } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: AuthUserType | null;
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
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await amplifyGetCurrentUser();
      setUser(user);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    await amplifySignIn({ username: email, password });
    const user = await amplifyGetCurrentUser();
    setUser(user);
    router.push('/');
  };

  const signUp = async (email: string, password: string, name: string) => {
    await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
  };

  const confirmSignUp = async (email: string, code: string) => {
    await amplifyConfirmSignUp({ username: email, confirmationCode: code });
    router.push('/login');
  };

  const signOut = async () => {
    await amplifySignOut();
    setUser(null);
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    await amplifyResetPassword({ username: email });
  };

  const confirmPassword = async (email: string, code: string, newPassword: string) => {
    await amplifyConfirmResetPassword({ username: email, confirmationCode: code, newPassword });
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