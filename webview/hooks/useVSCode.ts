declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
};

interface VSCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

let _vscode: VSCodeApi | undefined;

export function getVSCodeApi(): VSCodeApi {
  if (!_vscode) {
    _vscode = acquireVsCodeApi();
  }
  return _vscode;
}

export function useVSCode() {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [actions, setActions] = React.useState<any[]>([]);
  const vscode = getVSCodeApi();

  React.useEffect(() => {
    const handler = (event: Event) => {
      const data = (event as CustomEvent).detail;
      switch (data.type) {
        case 'init':
          setMessages(data.messages || []);
          break;
        case 'message':
          setMessages(prev => [...prev, data.message]);
          break;
        case 'messageUpdate':
          setMessages(prev => prev.map(m =>
            m.id === data.id ? { ...m, content: data.content } : m
          ));
          break;
        case 'toolCall':
          setMessages(prev => prev.map(m =>
            m.id === data.id
              ? { ...m, toolCalls: [...(m.toolCalls || []), data.toolCall] }
              : m
          ));
          break;
        case 'clear':
          setMessages([]);
          setActions([]);
          break;
        case 'addToInput':
          window.dispatchEvent(new CustomEvent('mimo-addToInput', { detail: data.text }));
          break;
        case 'actionApproved':
          setMessages(prev => prev.map(m => {
            if (!m.toolCalls) return m;
            return {
              ...m,
              toolCalls: m.toolCalls.map((tc: any) =>
                tc.id === data.actionId ? { ...tc, status: 'approved' } : tc
              )
            };
          }));
          break;
        case 'actionRejected':
          setMessages(prev => prev.map(m => {
            if (!m.toolCalls) return m;
            return {
              ...m,
              toolCalls: m.toolCalls.map((tc: any) =>
                tc.id === data.actionId ? { ...tc, status: 'rejected' } : tc
              )
            };
          }));
          break;
        case 'switchSession':
          setMessages(data.messages || []);
          break;
        case 'newSession':
        case 'deleteSession':
          if (data.messages) setMessages(data.messages);
          break;
      }
    };

    window.addEventListener('vscode-message', handler);
    return () => window.removeEventListener('vscode-message', handler);
  }, []);

  const sendMessage = React.useCallback((text: string, cwd: string) => {
    vscode.postMessage({ type: 'sendMessage', text, cwd });
  }, [vscode]);

  const approveAction = React.useCallback((actionId: string) => {
    vscode.postMessage({ type: 'approveAction', actionId });
  }, [vscode]);

  const rejectAction = React.useCallback((actionId: string) => {
    vscode.postMessage({ type: 'rejectAction', actionId });
  }, [vscode]);

  // Signal ready
  React.useEffect(() => {
    vscode.postMessage({ type: 'ready' });
  }, []);

  return { messages, actions, sendMessage, approveAction, rejectAction };
}
