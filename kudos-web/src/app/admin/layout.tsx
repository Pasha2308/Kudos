'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  HeartHandshake, 
  DollarSign, 
  ShieldAlert, 
  BrainCircuit, 
  Settings,
  LogOut,
  ArrowLeft
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Since we don't have the role in the user object yet, let's allow it in dev mode if they have a specific email or token
    // In production, the backend will reject their requests anyway, but for UI we need to show/hide
    // For now, assume if they got here, we'll try to render it and rely on API 403s. 
    // Ideally we'd fetch `/api/user/profile` to check role.
    const checkRole = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Fallback for dev mode
          if (data.role === 'admin' || user.email === 'admin@example.com' || user.uid === 'admin_user') {
            setIsAdmin(true);
          } else {
            // Uncomment to enforce strictly
            // router.push('/dashboard');
            setIsAdmin(true); // temporary for testing
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    };
    checkRole();
  }, [user, loading, router]);

  if (loading || checking) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Loading Admin...</div>;
  }

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Access Denied</div>;
  }

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Matches', href: '/admin/matches', icon: HeartHandshake },
    { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
    { name: 'Safety & Trust', href: '/admin/safety', icon: ShieldAlert },
    { name: 'AI Health', href: '/admin/ai-health', icon: BrainCircuit },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#111111] flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]">
              K
            </div>
            <h1 className="text-xl font-bold font-['Outfit'] tracking-tight">Kudos <span className="text-rose-400 font-normal">Admin</span></h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-rose-500/10 text-rose-400 font-medium' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-2">
            <ArrowLeft className="w-5 h-5" />
            Back to App
          </Link>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
