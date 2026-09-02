import React, { useState } from 'react';
import AvatarVisualizer from './components/AvatarVisualizer';
import ChatInterface from './components/ChatInterface';
import MemoryVault from './components/MemoryVault';
import AvatarCreator from './components/AvatarCreator';
import './App.css';

function App() {
  const [isActive, setIsActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const handleMessageSent = () => {
    setIsTyping(true);
    setIsActive(true);
    setTimeout(() => {
      setIsTyping(false);
      setTimeout(() => setIsActive(false), 2000);
    }, 2500);
  };

  const handleAvatarExported = (url) => setAvatarUrl(url);
  const handleReset = () => setAvatarUrl(null);

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <nav className="glass-panel top-nav">
        <h1 className="logo gradient-text">Aeterna</h1>
        <div className="nav-links">
          <span className="active-link">
            {avatarUrl ? 'Your Persona' : "Create Persona"}
          </span>
          {avatarUrl && (
            <span
              onClick={handleReset}
              style={{ cursor: 'pointer', color: 'rgba(168,85,247,0.8)' }}
              title="Regenerate avatar from new photos"
            >
              ↺ Regenerate
            </span>
          )}
        </div>
      </nav>

      {/* Main Grid */}
      <div className="main-content">
        <aside className="glass-panel memory-sidebar">
          <MemoryVault />
        </aside>

        <main
          className="glass-panel avatar-main"
          style={{ padding: !avatarUrl ? '0' : undefined }}
        >
          {!avatarUrl ? (
            <AvatarCreator onAvatarExported={handleAvatarExported} />
          ) : (
            <AvatarVisualizer isActive={isActive} avatarUrl={avatarUrl} />
          )}
        </main>

        <aside
          className="glass-panel chat-sidebar"
          style={{
            opacity:       !avatarUrl ? 0.45 : 1,
            pointerEvents: !avatarUrl ? 'none' : 'auto',
            transition:    'opacity 0.5s ease',
          }}
        >
          <ChatInterface onMessageSent={handleMessageSent} isTyping={isTyping} />
        </aside>
      </div>
    </div>
  );
}

export default App;

