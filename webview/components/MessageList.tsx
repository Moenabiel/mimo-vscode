import * as React from 'react';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: any[];
}

interface MessageListProps {
  messages: Message[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function MessageList({ messages, onApprove, onReject }: MessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <div className="welcome-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="10" r="1" fill="currentColor"/>
            <circle cx="9" cy="12" r="0.5" fill="currentColor"/>
            <circle cx="15" cy="12" r="0.5" fill="currentColor"/>
          </svg>
        </div>
        <h3>MiMo Code</h3>
        <p className="welcome-subtitle">AI coding assistant</p>
        <div className="welcome-suggestions">
          <button className="suggestion-chip" onClick={() => {
            window.dispatchEvent(new CustomEvent('mimo-addToInput', { detail: 'Explain what this project does' }));
          }}>
            Explain this project
          </button>
          <button className="suggestion-chip" onClick={() => {
            window.dispatchEvent(new CustomEvent('mimo-addToInput', { detail: 'Help me fix a bug' }));
          }}>
            Fix a bug
          </button>
          <button className="suggestion-chip" onClick={() => {
            window.dispatchEvent(new CustomEvent('mimo-addToInput', { detail: 'Add a new feature' }));
          }}>
            Add a feature
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map(msg => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
