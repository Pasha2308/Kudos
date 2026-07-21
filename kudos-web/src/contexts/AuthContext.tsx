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
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
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

  const login = async (email: string, password?: string) => {
    // If no password provided (legacy dev mode), use email as password
    const loginPassword = password || email; 
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: loginPassword })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to login');
    }

    const data = await res.json();
    const newUser = { uid: data.user.uid, email: data.user.email, name: data.user.name, token: data.token };
    
    setUser(newUser);
    localStorage.setItem('kudos_user', JSON.stringify(newUser));
    router.push('/dashboard');
  };

  const signup = async (email: string, password?: string, name?: string) => {
    const signupPassword = password || email;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: signupPassword, name })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to register');
    }

    const data = await res.json();
    const newUser = { uid: data.user.uid, email: data.user.email, name: data.user.name, token: data.token };
    
    setUser(newUser);
    localStorage.setItem('kudos_user', JSON.stringify(newUser));
    router.push('/onboarding');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kudos_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
