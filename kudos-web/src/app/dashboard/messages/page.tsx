'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    fetch(`${API_URL}/api/dm`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.conversations) setConversations(d.conversations);
        setLoadingConvos(false);
      })
      .catch(() => setLoadingConvos(false));
  }, [user]);

  useEffect(() => {
    if (!activeConvo || !user) return;
    
    fetch(`${API_URL}/api/dm/${activeConvo}/messages`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.messages) {
          setMessages(d.messages);
          scrollToBottom();
        }
      });
  }, [activeConvo, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvo) return;

    const text = inputText;
    setInputText('');

    const tempMsg = {
      id: Date.now().toString(),
      text,
      senderId: user?.uid,
      createdAt: { _seconds: Math.floor(Date.now() / 1000) }
    };
    
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      await fetch(`${API_URL}/api/dm/${activeConvo}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ text })
      });
      // Optionally re-fetch messages or just rely on optimistic UI
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  const getOtherParticipant = (convo: any) => {
    // Basic mock: return the ID of the person who isn't the current user
    return convo.participants.find((p: string) => p !== user?.uid) || 'Unknown User';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-neutral-950 text-white">
      {/* Sidebar: Conversation List */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-neutral-900/50">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-bold text-lg">Direct Messages</h2>
          <div className="mt-4 relative">
            <input 
              type="text" 
              placeholder="Jump to..." 
              className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loadingConvos ? (
            <div className="text-center p-4 text-neutral-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-4 text-neutral-500 text-sm">
              No conversations yet. Start one from the Humans page!
            </div>
          ) : (
            conversations.map(convo => (
              <button 
                key={convo.id}
                onClick={() => setActiveConvo(convo.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeConvo === convo.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-neutral-900 border-2 border-transparent overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getOtherParticipant(convo)}`} alt="avatar" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium truncate text-sm">{getOtherParticipant(convo)}</h3>
                    {convo.lastMessageAt && (
                      <span className="text-[10px] text-neutral-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(convo.lastMessageAt._seconds * 1000))}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${activeConvo === convo.id ? 'text-indigo-300' : 'text-neutral-400'}`}>
                    {convo.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-neutral-950 relative">
        {activeConvo ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-white/5 flex items-center px-6 bg-neutral-900/50 backdrop-blur-md absolute top-0 w-full z-10">
              <div className="flex items-center gap-3">
                <h2 className="font-bold">
                  {getOtherParticipant(conversations.find(c => c.id === activeConvo))}
                </h2>
                <div className="px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 font-medium">Online</div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 pt-24 pb-32">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-neutral-500 mt-20">
                    <div className="text-4xl mb-4">👋</div>
                    <p>Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine = msg.senderId === user?.uid;
                    const showAvatar = i === messages.length - 1 || messages[i + 1]?.senderId !== msg.senderId;
                    
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar Column */}
                        <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                          {showAvatar && !isMine && (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`} alt="avatar" className="w-8 h-8 rounded-full" />
                          )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`max-w-[70%] group`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                            isMine 
                              ? 'bg-indigo-600 text-white rounded-br-sm' 
                              : 'bg-neutral-800 text-neutral-100 rounded-bl-sm border border-white/5'
                          }`}>
                            {msg.text}
                          </div>
                          {showAvatar && msg.createdAt && (
                            <div className={`text-[10px] text-neutral-500 mt-1 ${isMine ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                              {new Date(msg.createdAt._seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={sendMessage} className="relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Message..."
                    className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-4 pr-12 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-lg"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim()}
                    className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl flex items-center justify-center transition-colors"
                  >
                    ➤
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500 flex-col gap-4">
            <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center text-3xl">✉️</div>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
