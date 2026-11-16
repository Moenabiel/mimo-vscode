import * as React from 'react';
import { useVSCode } from '../hooks/useVSCode';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ApprovalBar } from './ApprovalBar';
import { SettingsPanel } from './SettingsPanel';

export function ChatPanel() {
  const { messages, actions, sendMessage, approveAction, rejectAction } = useVSCode();
  const [cwd, setCwd] = React.useState('');
  const [showSettings, setShowSettings] = React.useState(false);
  const [settings, setSettings] = React.useState({
    path: '',
    autoApproveReads: true,
    autoApproveTerminal: false,
    defaultModel: ''
  });

  React.useEffect(() => {
    // Try to get workspace folder
    try {
      const vscode = acquireVsCodeApi();
      // For now, use a reasonable default
      setCwd('C:\\Users\\sumay');
    } catch {
      setCwd('C:\\');
    }
  }, []);

  // Track pending tool calls for the approval bar
  const pendingActions = React.useMemo(() => {
    const pending: any[] = [];
    messages.forEach(msg => {
      if (msg.toolCalls) {
        msg.toolCalls.forEach((tc: any) => {
          if (tc.status === 'pending') {
            pending.push({ id: tc.id, toolCall: tc, status: 'pending' });
          }
        });
      }
    });
    return pending;
  }, [messages]);

  const handleSend = (text: string) => {
    if (text.trim()) {
      sendMessage(text, cwd);
    }
  };

  const handleApproveAll = () => {
    pendingActions.forEach(a => approveAction(a.id));
  };

  const handleSaveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    setShowSettings(false);
  };

  const isRunning = messages.some(m =>
    m.role === 'assistant' && m.content === '' && !m.toolCalls
  );

  if (showSettings) {
    return (
      <div className="chat-panel">
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <MessageList
        messages={messages}
        onApprove={approveAction}
        onReject={rejectAction}
      />
      <ApprovalBar
        actions={pendingActions}
        onApprove={approveAction}
        onReject={rejectAction}
        onApproveAll={handleApproveAll}
      />
      <ChatInput onSend={handleSend} disabled={isRunning} />
    </div>
  );
}
