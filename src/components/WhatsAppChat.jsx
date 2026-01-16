import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useLanguage } from '../App';
import { runAgentLoop } from '../services/agentLoop';
import { agentMemory } from '../services/agentMemory';
import ReasoningLog from './ReasoningLog';
import { ArrowLeftIcon, MenuIcon, SendIcon, SmileIcon, SignalIcon, TrashIcon, AgentIcon, ColoredProjectLogo } from './Icons';

const EMOJI_LIST = ['👍', '💧', '🌾', '☀️', '🌧️', '⚡', '🙏', '✅', '❌', '❓'];

// Simple markdown parser for chat messages
const parseMarkdown = (text) => {
  if (!text) return text;

  // Parse bold **text**
  let parsed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Parse italic *text*
  parsed = parsed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Parse headers
  parsed = parsed.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  parsed = parsed.replace(/^## (.+)$/gm, '<h3>$1</h3>');

  // Parse bullet points
  parsed = parsed.replace(/^- (.+)$/gm, '• $1');

  return parsed;
};

function WhatsAppChat() {
  const { farm, weather, powerStatus, farmerId } = useApp();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Initial greeting removed - start with empty chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setShowEmoji(false);
    setCurrentTool(null);

    try {
      // Build context with agent memory
      const memoryContext = agentMemory.getContext();
      const context = {
        weather,
        farm: farm || memoryContext.farm,
        powerStatus,
        crop: farm?.crops?.[0] || memoryContext.crop,
        language,
        farmerId: farmerId || memoryContext.farmerId
      };

      // Get conversation history
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content
      }));

      // Run agent loop
      const response = await runAgentLoop(input.trim(), context, history);

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message,
        time: new Date(),
        reasoning: response.reasoning,
        toolCallCount: response.toolCallCount,
        isDemo: response.isDemo
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again. 🙏',
        time: new Date(),
        reasoning: null
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setCurrentTool(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };



  // Quick suggestion chips
  const suggestions = [t('sugg_irrigate'), t('sugg_weather'), t('sugg_save'), t('weekly_report')];

  return (
    <div className="chat-container">
      {/* Modern Glass Header */}
      <header className="chat-header">
        <button className="btn-icon back-btn" onClick={() => navigate('/')} aria-label="Back">
          <ArrowLeftIcon size={20} />
        </button>
        <div className="chat-header-avatar">
          <ColoredProjectLogo size={28} />
        </div>
        <div className="chat-header-info">
          <h2>BloomWise Agent</h2>
          <span>
            {isTyping
              ? currentTool
                ? `${currentTool}...`
                : t('thinking')
              : t('ai_agent')}
          </span>
        </div>
        <div className="header-menu-spacer"></div>
        <button className="btn-icon menu-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} aria-label="Menu">
          <MenuIcon size={20} />
        </button>
        {showMenu && (
          <div className="menu-dropdown glass-strong" style={{ backdropFilter: 'blur(12px)', background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button onClick={() => { navigate('/simulate'); setShowMenu(false); }}>
              <SignalIcon size={18} /> Signal History
            </button>
            <button onClick={() => {
              setMessages([messages[0]]);
              agentMemory.clearConversation();
              setShowMenu(false);
            }}>
              <TrashIcon size={18} /> {t('clear_chat')}
            </button>
          </div>
        )}
      </header>

      {/* Messages Area */}
      <div className="chat-messages" onClick={() => setShowMenu(false)}>
        {/* Date Separator */}
        <div className="date-separator">
          <span>Today</span>
        </div>

        {messages.map(message => (
          <div
            key={message.id}
            className={`chat-bubble ${message.role === 'user' ? 'sent' : 'received'}`}
          >
            <div
              className="bubble-content"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(message.content).split('\n').join('<br />')
              }}
            />

            {/* Show reasoning for assistant messages */}
            {message.role === 'assistant' && message.reasoning && (
              <ReasoningLog steps={message.reasoning} />
            )}

            <span className="chat-bubble-time">
              {formatTime(message.time)}
              {message.role === 'user' && ' ✓✓'}
              {message.isDemo && ' (demo)'}
            </span>
          </div>
        ))}

        {/* Typing Indicator with Tool Info */}
        {isTyping && (
          <div className="typing-indicator-container">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            {currentTool && (
              <div className="current-tool">
                {TOOL_ICONS[currentTool] || '🔧'} {currentTool}
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips (only if few messages) */}
      {messages.length < 3 && (
        <div className="suggestions">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              className="suggestion-chip"
              onClick={() => setInput(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="emoji-picker glass-strong">
          {EMOJI_LIST.map((emoji, i) => (
            <button key={i} onClick={() => handleEmojiSelect(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Area - Fixed at Bottom */}
      <div className="chat-input-container">
        <button
          className={`btn-icon emoji-btn ${showEmoji ? 'active' : ''}`}
          onClick={() => setShowEmoji(!showEmoji)}
          title="Add emoji"
          aria-label="Emoji picker"
        >
          <SmileIcon size={24} />
        </button>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder={t('type_message')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          title="Send message"
          aria-label="Send"
        >
          <SendIcon size={20} />
        </button>
      </div>

      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 60px);
          height: calc(100dvh - 60px);
          background: transparent;
          overflow: hidden;
          position: relative;
        }
        
        .chat-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          position: relative;
          z-index: 50;
          flex-shrink: 0;
        }
        
        .chat-header-avatar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-glass);
          border-radius: 50%;
          border: 1px solid var(--border-glass);
          flex-shrink: 0;
        }
        
        .header-menu-spacer {
          flex: 1;
        }
        
        .chat-header .back-btn,
        .chat-header .menu-btn {
          background: var(--bg-glass);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .chat-header .back-btn:hover,
        .chat-header .menu-btn:hover {
          background: var(--bg-glass-hover);
        }
        
        .chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .menu-dropdown {
          position: fixed;
          top: 60px;
          right: 16px;
          min-width: 180px;
          z-index: 1000;
          overflow: hidden;
          border-radius: var(--radius-lg);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .menu-dropdown button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1rem;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--text-primary);
          transition: background var(--transition-fast);
        }
        
        .menu-dropdown button:hover {
          background: var(--bg-glass-hover);
        }
        
        .menu-dropdown button svg {
          flex-shrink: 0;
        }
        
        .date-separator {
          text-align: center;
          margin: 0.5rem 0 1rem;
        }
        
        .date-separator span {
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--text-muted);
          border: 1px solid var(--border-glass);
        }
        
        .bubble-content {
          font-size: 0.9375rem;
          line-height: 1.6;
        }
        
        .bubble-content strong {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .bubble-content h3, .bubble-content h4 {
          margin: 0.5rem 0;
          font-size: 1rem;
        }
        
        /* Reasoning Container */
        .reasoning-container {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-glass);
        }
        
        .reasoning-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-glass);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          cursor: pointer;
          width: 100%;
          transition: all var(--transition-fast);
        }
        
        .reasoning-toggle:hover {
          background: var(--bg-glass-hover);
          border-color: var(--accent-primary);
        }
        
        .reasoning-icon {
          font-size: 1rem;
        }
        
        .toggle-arrow {
          margin-left: auto;
        }
        
        .reasoning-steps {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: var(--bg-glass);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-glass);
        }
        
        .reasoning-step {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.375rem 0;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .reasoning-step.tool_call {
          color: var(--accent-blue);
        }
        
        .reasoning-step.tool_result {
          color: var(--accent-green);
          padding-left: 1.5rem;
        }
        
        .step-icon {
          flex-shrink: 0;
        }
        
        .step-text strong {
          color: var(--text-primary);
        }
        
        /* Typing Indicator */
        .typing-indicator-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
        }
        
        .current-tool {
          font-size: 0.75rem;
          color: var(--accent-blue);
          background: var(--bg-glass);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-md);
        }
        
        .suggestions {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          overflow-x: auto;
          background: transparent;
          flex-shrink: 0;
        }
        
        .suggestion-chip {
          flex-shrink: 0;
          padding: 0.5rem 1rem;
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-primary);
        }
        
        .suggestion-chip:hover {
          border-color: var(--accent-primary);
          background: var(--bg-glass-hover);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        
        .emoji-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .emoji-btn.active {
          background: var(--bg-glass-hover) !important;
          box-shadow: 0 0 15px var(--accent-glow);
        }
        
        .emoji-picker {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
          border-top: 1px solid var(--border-glass);
          flex-shrink: 0;
        }
        
        .emoji-picker button {
          font-size: 1.5rem;
          padding: 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        
        .emoji-picker button:hover {
          background: var(--bg-glass-hover);
          transform: scale(1.2);
        }
        
        .chat-input-container {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-glass);
          backdrop-filter: blur(20px);
          border-top: 1px solid var(--border-glass);
        }
        
        .send-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-primary);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 15px var(--accent-glow);
        }
        
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default WhatsAppChat;
