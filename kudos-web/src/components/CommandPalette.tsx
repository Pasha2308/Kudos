'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{humans: any[], rooms: any[]}>({ humans: [], rooms: [] });
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
      setResults({ humans: [], rooms: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2 || !user) {
      setResults({ humans: [], rooms: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [query, user, API_URL]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-white/10">
          <span className="text-xl mr-3 text-neutral-400">🔍</span>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search humans, rooms, or messages..." 
            className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-neutral-500"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button 
            className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded"
            onClick={() => setIsOpen(false)}
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && <div className="p-4 text-center text-neutral-500">Searching...</div>}
          
          {!loading && query.length >= 2 && results.humans.length === 0 && results.rooms.length === 0 && (
            <div className="p-8 text-center text-neutral-500">
              No results found for "{query}"
            </div>
          )}

          {!loading && results.humans.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Humans
              </div>
              {results.humans.map(h => (
                <button 
                  key={h.id}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-500/10 flex items-center gap-3 transition-colors group"
                  onClick={() => {
                    setIsOpen(false);
                    // navigate to user profile or DM
                    router.push('/dashboard/humans'); 
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">👤</div>
                  <div>
                    <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">{h.name || h.email || 'Anonymous'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.rooms.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Rooms
              </div>
              {results.rooms.map(r => (
                <button 
                  key={r.id}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-purple-500/10 flex items-center gap-3 transition-colors group"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/dashboard/rooms');
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">🌐</div>
                  <div>
                    <div className="font-medium text-white group-hover:text-purple-300 transition-colors">{r.name}</div>
                    <div className="text-xs text-neutral-500">{r.participants?.length || 0} participants</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-white/5 bg-neutral-900 flex justify-between items-center">
          <div className="flex items-center gap-4 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1"><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-white/10">↑</kbd><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-white/10">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-white/10">↵</kbd> to select</span>
          </div>
          <div className="text-[10px] text-neutral-600 font-medium">Kudos Search</div>
        </div>
      </div>
    </div>
  );
}
