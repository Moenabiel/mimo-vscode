import * as React from 'react';

interface ToolCall {
  id: string;
  type: string;
  label: string;
  details: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

interface MessageBubbleProps {
  message: Message;
  onApprove?: (actionId: string) => void;
  onReject?: (actionId: string) => void;
}

export function MessageBubble({ message, onApprove, onReject }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-header">
        <span className="message-role">{isUser ? 'You' : 'MiMo'}</span>
      </div>
      <div className="message-content">
        <MarkdownRenderer content={message.content} />
      </div>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="message-toolcalls">
          {message.toolCalls.map(tc => (
            <ToolCallCard
              key={tc.id}
              toolCall={tc}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCallCard({ toolCall, onApprove, onReject }: { toolCall: ToolCall; onApprove?: (id: string) => void; onReject?: (id: string) => void }) {
  const [expanded, setExpanded] = React.useState(false);

  const icon = toolCall.type === 'file_edit' ? '✏️'
    : toolCall.type === 'terminal_command' ? '🖥️'
    : toolCall.type === 'file_read' ? '📖'
    : toolCall.type === 'web_fetch' ? '🌐'
    : '🔧';

  const typeLabel = toolCall.type === 'file_edit' ? 'File Edit'
    : toolCall.type === 'terminal_command' ? 'Terminal Command'
    : toolCall.type === 'file_read' ? 'File Read'
    : toolCall.type === 'web_fetch' ? 'Web Fetch'
    : 'Tool Call';

  return (
    <div className={`tool-call-card ${toolCall.status}`}>
      <div className="tool-call-header" onClick={() => setExpanded(!expanded)}>
        <span className="tool-call-icon">{icon}</span>
        <span className="tool-call-type">{typeLabel}</span>
        <span className="tool-call-label">{toolCall.label}</span>
        <span className="tool-call-expand">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div className="tool-call-details">
          <pre className="tool-call-code">
            {Object.entries(toolCall.details).map(([key, value]) => (
              <div key={key}><span className="detail-key">{key}:</span> {value}</div>
            ))}
          </pre>
        </div>
      )}
      {toolCall.status === 'pending' && (
        <div className="tool-call-actions">
          <button
            className="tool-call-btn approve"
            onClick={(e) => { e.stopPropagation(); onApprove?.(toolCall.id); }}
          >
            ✓ Approve
          </button>
          <button
            className="tool-call-btn reject"
            onClick={(e) => { e.stopPropagation(); onReject?.(toolCall.id); }}
          >
            ✕ Reject
          </button>
        </div>
      )}
      {toolCall.status !== 'pending' && (
        <div className="tool-call-status-badge">
          {toolCall.status === 'approved' && '✅ Approved'}
          {toolCall.status === 'rejected' && '❌ Rejected'}
          {toolCall.status === 'executed' && '✔️ Done'}
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Simple markdown parser for MVP
  // Handles: code blocks, inline code, bold, italic, links, lists, headings
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const lang = lines[0].replace('```', '').trim();
          const code = lines.slice(1, -1).join('\n');
          return (
            <div key={i} className="code-block-wrapper">
              {lang && <div className="code-lang">{lang}</div>}
              <pre className="code-block">
                <code>{code}</code>
              </pre>
              <CopyButton text={code} />
            </div>
          );
        }
        return <span key={i} className="text-content">{renderInlineMarkdown(part)}</span>;
      })}
    </>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  // Match inline code, bold, italic, links
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const matched = match[0];
    if (matched.startsWith('`')) {
      elements.push(
        <code key={match.index} className="inline-code">
          {matched.slice(1, -1)}
        </code>
      );
    } else if (matched.startsWith('**')) {
      elements.push(
        <strong key={match.index}>{matched.slice(2, -2)}</strong>
      );
    } else if (matched.startsWith('*')) {
      elements.push(
        <em key={match.index}>{matched.slice(1, -1)}</em>
      );
    } else if (matched.startsWith('[')) {
      const linkMatch = matched.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        elements.push(
          <a key={match.index} href={linkMatch[2]} className="message-link">
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button className="copy-button" onClick={handleCopy} title="Copy code">
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
}
