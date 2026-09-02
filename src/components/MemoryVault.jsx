import React from 'react';
import { Image, Music, Film, Clock } from 'lucide-react';
import './MemoryVault.css';

const MemoryVault = () => {
  const memories = [
    { id: 1, type: 'image', title: 'Summer in Kyoto', date: 'Aug 2021', icon: <Image size={18} /> },
    { id: 2, type: 'audio', title: 'Voicemail - Birthday', date: 'Oct 2022', icon: <Music size={18} /> },
    { id: 3, type: 'video', title: 'Graduation Day', date: 'May 2020', icon: <Film size={18} /> },
    { id: 4, type: 'image', title: 'Coffee Shop Morning', date: 'Jan 2023', icon: <Image size={18} /> },
  ];

  return (
    <div className="vault-container">
      <div className="vault-header">
        <h3 style={{ margin: 0, fontWeight: 500, fontSize: '18px' }}>Memory Vault</h3>
        <span className="subtitle">4 preserved artifacts</span>
      </div>

      <div className="vault-grid">
        {memories.map((mem) => (
          <div key={mem.id} className="memory-card animate-fade-in" style={{ animationDelay: `${mem.id * 0.1}s` }}>
            <div className="memory-icon-wrapper">
              {mem.icon}
            </div>
            <div className="memory-info">
              <h4>{mem.title}</h4>
              <div className="memory-meta">
                <Clock size={12} />
                <span>{mem.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="vault-footer">
        <button className="glass-button w-full">
          + Add Memory
        </button>
      </div>
    </div>
  );
};

export default MemoryVault;
