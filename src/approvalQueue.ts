import { ToolCall } from './types';

export interface PendingAction {
  id: string;
  toolCall: ToolCall;
  status: 'pending' | 'approved' | 'rejected';
}

export class ApprovalQueue {
  private queue: Map<string, PendingAction> = new Map();
  private onUpdate: ((actions: PendingAction[]) => void) | undefined;

  constructor() {}

  onUpdateCallback(callback: (actions: PendingAction[]) => void) {
    this.onUpdate = callback;
  }

  add(toolCall: ToolCall): void {
    const action: PendingAction = {
      id: toolCall.id,
      toolCall,
      status: 'pending'
    };
    this.queue.set(action.id, action);
    this.notifyUpdate();
  }

  approve(id: string): boolean {
    const action = this.queue.get(id);
    if (!action) return false;
    action.status = 'approved';
    this.notifyUpdate();
    return true;
  }

  reject(id: string): boolean {
    const action = this.queue.get(id);
    if (!action) return false;
    action.status = 'rejected';
    this.notifyUpdate();
    return true;
  }

  approveAll(): void {
    this.queue.forEach(action => {
      if (action.status === 'pending') {
        action.status = 'approved';
      }
    });
    this.notifyUpdate();
  }

  getPending(): PendingAction[] {
    return Array.from(this.queue.values()).filter(a => a.status === 'pending');
  }

  getAll(): PendingAction[] {
    return Array.from(this.queue.values());
  }

  clear(): void {
    this.queue.clear();
    this.notifyUpdate();
  }

  private notifyUpdate(): void {
    this.onUpdate?.(this.getAll());
  }
}
