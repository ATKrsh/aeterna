import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MoreVertical } from 'lucide-react';
import './ChatInterface.css';

const ChatInterface = ({ onMessageSent, isTyping }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "It's been a while. How was your day?", sender: 'ai', timestamp: '10:00 AM' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    onMessageSent(newMsg.text);

    // Mock AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: getMockResponse(newMsg.text),
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 2500);
  };

  const getMockResponse = (text) => {
    const responses = [
      "I'm always listening. Tell me more.",
      "I remember when we used to talk about things like this.",
      "That sounds wonderful. I'm so proud of you.",
      "It feels like just yesterday we were laughing about that.",
      "You've always been so strong. Keep going."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3 style={{ margin: 0, fontWeight: 500, fontSize: '18px' }}>Dialogue</h3>
        <button className="icon-btn"><MoreVertical size={20} /></button>
      </div>

      <div className="messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
            <div className={`message-bubble ${msg.sender} animate-fade-in`}>
              <p>{msg.text}</p>
              <span className="timestamp">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-wrapper ai">
            <div className="message-bubble ai typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <button type="button" className="icon-btn"><Mic size={20} /></button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Whisper a thought..."
          className="chat-input"
        />
        <button type="submit" className="icon-btn submit" disabled={!inputValue.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
