export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  status?: 'pending' | 'approved' | 'rejected' | 'executed';
}

export interface ToolCall {
  id: string;
  type: 'file_edit' | 'terminal_command' | 'file_read' | 'web_fetch' | 'unknown';
  label: string;
  details: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

export interface AgentEvent {
  type: 'text_delta' | 'text_done' | 'tool_call' | 'tool_result' | 'error' | 'done' | 'status';
  content?: string;
  toolCall?: ToolCall;
  error?: string;
  status?: 'idle' | 'running' | 'thinking' | 'error';
}

export interface ExtensionMessage {
  type: string;
  [key: string]: unknown;
}

export interface WebviewMessage {
  type: string;
  [key: string]: unknown;
}

export type AgentStatus = 'idle' | 'running' | 'thinking' | 'error';
