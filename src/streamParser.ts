import * as readline from 'readline';
import { Readable } from 'stream';
import { AgentEvent } from './types';

export class StreamParser {
  private rl: readline.Interface | null = null;

  parse(
    stream: Readable,
    onEvent: (event: AgentEvent) => void,
    onEnd: () => void
  ): void {
    this.rl = readline.createInterface({ input: stream });

    this.rl.on('line', (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const event = JSON.parse(trimmed) as AgentEvent;
        onEvent(event);
      } catch {
        // Plain text — treat as text delta
        onEvent({ type: 'text_delta', content: trimmed });
      }
    });

    this.rl.on('close', () => {
      onEnd();
    });
  }

  destroy(): void {
    this.rl?.close();
    this.rl = null;
  }
}
