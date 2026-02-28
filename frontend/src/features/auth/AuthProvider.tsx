"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser, signOut as authSignOut, refreshToken, getAccessToken } from '@/lib/auth';
import { Hub } from 'aws-amplify/utils';
import { useRouter } from 'next/navigation';
import type { AuthUser } from 'aws-amplify/auth';

// Migrated to AuthUser

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshAuthToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const hubListenerCancel = Hub.listen('auth', async (capsule: any) => {
      const { event } = capsule.payload;
      if (event === 'signedIn' || event === 'autoSignIn' || event === 'tokenRefresh') {
        await checkAuth();
      } else if (event === 'signedOut') {
        setUser(null);
      }
    });

    return () => hubListenerCancel();
  }, []);

  const signOut = async () => {
    try {
      await authSignOut();
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getToken = async () => {
    return await getAccessToken();
  };

  const refreshAuthToken = async () => {
    try {
      await refreshToken();
      await checkAuth();
    } catch (error) {
      console.error('Error refreshing token:', error);
      await signOut();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signOut,
      getToken,
      refreshAuthToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}