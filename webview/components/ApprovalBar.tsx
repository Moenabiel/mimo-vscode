import * as React from 'react';

interface PendingAction {
  id: string;
  toolCall: {
    id: string;
    type: string;
    label: string;
    details: Record<string, string>;
  };
  status: 'pending' | 'approved' | 'rejected';
}

interface ApprovalBarProps {
  actions: PendingAction[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApproveAll: () => void;
}

export function ApprovalBar({ actions, onApprove, onReject, onApproveAll }: ApprovalBarProps) {
  const pending = actions.filter(a => a.status === 'pending');

  if (pending.length === 0) return null;

  return (
    <div className="approval-bar">
      <div className="approval-header">
        <span className="approval-count">{pending.length} action{pending.length > 1 ? 's' : ''} pending</span>
        <button className="approval-btn approve-all" onClick={onApproveAll}>
          Approve All
        </button>
      </div>
      <div className="approval-list">
        {pending.map(action => (
          <div key={action.id} className="approval-item">
            <span className="approval-icon">
              {action.toolCall.type === 'file_edit' ? '✏️' :
               action.toolCall.type === 'terminal_command' ? '🖥️' : '🔧'}
            </span>
            <span className="approval-label">{action.toolCall.label}</span>
            <div className="approval-buttons">
              <button
                className="approval-btn approve"
                onClick={() => onApprove(action.id)}
              >
                ✓
              </button>
              <button
                className="approval-btn reject"
                onClick={() => onReject(action.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
