import * as React from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Listen for addToInput events
  React.useEffect(() => {
    const handler = (event: Event) => {
      const data = (event as CustomEvent).detail;
      setText(prev => prev + (prev ? '\n' : '') + data);
      textareaRef.current?.focus();
    };
    window.addEventListener('mimo-addToInput', handler);
    return () => window.removeEventListener('mimo-addToInput', handler);
  }, []);

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-container">
      <textarea
        ref={textareaRef}
        className="chat-input"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Waiting for response..." : "Message MiMo..."}
        disabled={disabled}
        rows={1}
      />
      <button
        className="chat-send-button"
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        title="Send message (Enter)"
      >
        ▶
      </button>
    </div>
  );
}
