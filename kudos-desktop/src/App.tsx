import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState("I'm Kudos. Click me to chat!");
  const [loading, setLoading] = useState(false);

  // Since we haven't wired up the secondary chat window yet (via Tauri IPC),
  // we'll use a simple in-pet chat bubble for this initial v0.1 test.

  const handlePetClick = () => {
    setChatOpen(!chatOpen);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    const userMsg = message;
    setMessage('');
    
    try {
      // Connect to our local Cloud Run / Express backend
      const res = await fetch('http://localhost:8080/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, userId: 'test_founder_1' })
      });
      
      const data = await res.json();
      setReply(data.reply || "Something went wrong.");
    } catch (err) {
      console.error(err);
      setReply("I couldn't reach my brain... (API offline)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drag-region">
      {chatOpen && (
        <div className="chat-bubble">
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#ff7b72' }}>Kudos</p>
          <p style={{ margin: '0 0 12px 0' }}>{loading ? "Thinking..." : reply}</p>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tell me anything..."
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#111',
                color: 'white',
                outline: 'none',
                WebkitAppRegion: 'no-drag' // important so input is clickable
              }}
            />
            <button 
              onClick={handleSendMessage}
              style={{
                background: '#ff7b72',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '0 10px',
                cursor: 'pointer',
                WebkitAppRegion: 'no-drag'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <div className="pet-container">
        {/* Placeholder for the pixel art sprite sheet */}
        <div 
          className="pet-sprite" 
          onClick={handlePetClick}
          title="Click to talk, drag to move"
        ></div>
      </div>
    </div>
  );
}

export default App;
