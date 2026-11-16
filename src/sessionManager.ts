import * as vscode from 'vscode';
import { ChatMessage } from './types';

export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  workspaceFolder?: string;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private activeSessionId: string | undefined;
  private static STORAGE_KEY = 'mimo.sessions';
  private static ACTIVE_KEY = 'mimo.activeSession';

  constructor(private context: vscode.ExtensionContext) {
    this.load();
  }

  /**
   * Load sessions from globalState.
   */
  private load() {
    const stored = this.context.globalState.get<Session[]>(SessionManager.STORAGE_KEY, []);
    for (const session of stored) {
      this.sessions.set(session.id, session);
    }
    this.activeSessionId = this.context.globalState.get<string>(SessionManager.ACTIVE_KEY);
  }

  /**
   * Save sessions to globalState.
   */
  private save() {
    const stored = Array.from(this.sessions.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 50); // Keep last 50 sessions

    this.context.globalState.update(SessionManager.STORAGE_KEY, stored);
    this.context.globalState.update(SessionManager.ACTIVE_KEY, this.activeSessionId);
  }

  /**
   * Create a new session.
   */
  create(workspaceFolder?: string): Session {
    const session: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workspaceFolder
    };

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    this.save();
    return session;
  }

  /**
   * Get the active session.
   */
  getActive(): Session | undefined {
    if (!this.activeSessionId) {
      // Get most recent session
      const sorted = this.getAll().sort((a, b) => b.updatedAt - a.updatedAt);
      if (sorted.length > 0) {
        this.activeSessionId = sorted[0].id;
        return sorted[0];
      }
      return undefined;
    }
    return this.sessions.get(this.activeSessionId);
  }

  /**
   * Set active session.
   */
  setActive(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Get all sessions.
   */
  getAll(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get sessions for a workspace.
   */
  getByWorkspace(workspaceFolder: string): Session[] {
    return this.getAll().filter(s => s.workspaceFolder === workspaceFolder);
  }

  /**
   * Get a session by ID.
   */
  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session messages.
   */
  updateMessages(sessionId: string, messages: ChatMessage[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = messages;
      session.updatedAt = Date.now();

      // Auto-generate title from first user message
      if (session.title === 'New Chat' && messages.length > 0) {
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg) {
          session.title = firstUserMsg.content.slice(0, 50) +
            (firstUserMsg.content.length > 50 ? '...' : '');
        }
      }

      this.save();
    }
  }

  /**
   * Delete a session.
   */
  delete(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted && this.activeSessionId === sessionId) {
      this.activeSessionId = undefined;
    }
    if (deleted) this.save();
    return deleted;
  }

  /**
   * Clear all sessions.
   */
  clearAll(): void {
    this.sessions.clear();
    this.activeSessionId = undefined;
    this.save();
  }

  /**
   * Get session count.
   */
  count(): number {
    return this.sessions.size;
  }
}
