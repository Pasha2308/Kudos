'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MoreVertical, ShieldCheck, ShieldAlert, BadgeCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        let url = `${API_URL}/api/admin/users?limit=50`;
        if (search) url += `&search=${search}`;
        if (planFilter) url += `&plan=${planFilter}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (e) {
        console.error('Failed to fetch users', e);
      } finally {
        setLoading(false);
      }
    };
    
    // debounce search
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [user, search, planFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">Users</h1>
          <p className="text-gray-400 mt-1">Manage users, KYC, and badges.</p>
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>
        <select 
          value={planFilter} 
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-[#111111] border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-rose-500"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Plan</th>
              <th className="px-6 py-4 font-medium">KYC</th>
              <th className="px-6 py-4 font-medium">Badges</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-bold text-xs">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{u.name || 'Anonymous User'}</div>
                        <div className="text-gray-500 text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider
                      ${u.plan === 'elite' ? 'bg-amber-500/10 text-amber-400' : 
                        u.plan === 'pro' ? 'bg-blue-500/10 text-blue-400' : 
                        'bg-gray-500/10 text-gray-400'}`}
                    >
                      {u.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.kycStatus === 'approved' ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                        <ShieldCheck className="w-4 h-4" /> Approved
                      </div>
                    ) : u.kycStatus === 'pending' ? (
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                        <ShieldAlert className="w-4 h-4" /> Pending
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {u.badges?.includes('trusted') && <span title="Trusted"><BadgeCheck className="w-4 h-4 text-blue-400" /></span>}
                      {u.badges?.includes('advisor') && <span title="Advisor"><BadgeCheck className="w-4 h-4 text-amber-400" /></span>}
                      {u.badges?.includes('verified_founder') && <span title="Verified Founder"><BadgeCheck className="w-4 h-4 text-emerald-400" /></span>}
                      {(!u.badges || u.badges.length === 0) && <span className="text-gray-500 text-xs">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/users/${u.uid}`} className="text-rose-400 hover:text-rose-300 font-medium text-xs">
                      View Detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
