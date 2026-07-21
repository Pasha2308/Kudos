'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: any;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors relative"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-neutral-800/50">
            <h3 className="font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-indigo-400 hover:text-indigo-300">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => {
                const date = n.createdAt?._seconds 
                  ? new Date(n.createdAt._seconds * 1000) 
                  : new Date();
                
                return (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                    }}
                    className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!n.isRead ? 'bg-indigo-500/10' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className={`text-sm ${!n.isRead ? 'font-bold text-white' : 'font-medium text-neutral-300'}`}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-2">
                      {formatDistanceToNow(date, { addSuffix: true })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-3 text-center border-t border-white/10 bg-neutral-800/50">
            <button className="text-xs text-neutral-400 hover:text-white transition-colors">
              View All Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
