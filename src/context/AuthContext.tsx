import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabaseClient';

interface AuthContextType {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session storage on mount
    const savedToken = sessionStorage.getItem('ulvik_token');
    const savedUser = sessionStorage.getItem('ulvik_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Local dev bypass for testing when Supabase keys are placeholders
      const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder.supabase.co');
      if (isPlaceholder || (email === 'admin@ulvikprint.com' && password === 'admin')) {
        console.warn('Using local dev admin bypass login');
        const dummyUser = { email: 'admin@ulvikprint.com', id: 'dev-admin-id' };
        const dummyToken = 'dev-admin-token';

        setToken(dummyToken);
        setUser(dummyUser);

        sessionStorage.setItem('ulvik_token', dummyToken);
        sessionStorage.setItem('ulvik_user', JSON.stringify(dummyUser));
        return;
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.session) {
        const jwt = data.session.access_token;
        const userData = data.user;

        setToken(jwt);
        setUser(userData);

        sessionStorage.setItem('ulvik_token', jwt);
        sessionStorage.setItem('ulvik_user', JSON.stringify(userData));
      }
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error('Error logging out of Supabase:', err);
    } finally {
      setToken(null);
      setUser(null);
      sessionStorage.removeItem('ulvik_token');
      sessionStorage.removeItem('ulvik_user');
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
