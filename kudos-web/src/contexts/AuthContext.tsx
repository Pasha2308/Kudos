'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  uid: string;
  email: string;
  name?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('kudos_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('kudos_user');
      }
    }
    setLoading(false);
  }, []);

  // Protect routes
  useEffect(() => {
    if (!loading) {
      if (pathname.startsWith('/dashboard') && !user) {
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, name?: string) => {
    const uid = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const token = `mock_token_${uid}`;
    
    // Register the user on the backend
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, name: name || uid })
      });
    } catch (e) {
      console.error('Failed to register user to backend', e);
    }

    const newUser = { uid, email, name: name || uid, token };
    setUser(newUser);
    localStorage.setItem('kudos_user', JSON.stringify(newUser));
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kudos_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
