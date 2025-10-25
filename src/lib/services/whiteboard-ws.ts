import type { Session } from './whiteboard-db';

interface WhiteboardMessage {
  type: 'session_update' | 'participant_joined' | 'participant_left' | 'sketch_saved' | 'status_changed';
  sessionId: string;
  data: any;
}

class WhiteboardWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private sessionId: string | null = null;
  private participantId: string | null = null;
  private messageHandlers: ((message: WhiteboardMessage) => void)[] = [];

  connect(sessionId: string, participantId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId;
        this.participantId = participantId;

        // Use WebSocket URL - for development, you might use localhost
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/whiteboard?sessionId=${sessionId}&participantId=${participantId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WhiteboardMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.ws = null;
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.sessionId && this.participantId) {
        this.connect(this.sessionId, this.participantId).catch(err => {
          console.error('Reconnect failed:', err);
        });
      }
    }, delay) as unknown as number;
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.sessionId = null;
    this.participantId = null;
    this.reconnectAttempts = 0;
  }

  send(message: WhiteboardMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  private handleMessage(message: WhiteboardMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  onMessage(handler: (message: WhiteboardMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Broadcast session update
  broadcastSessionUpdate(session: Session) {
    this.send({
      type: 'session_update',
      sessionId: session.id,
      data: session,
    });
  }

  // Broadcast sketch saved
  broadcastSketchSaved(sessionId: string) {
    this.send({
      type: 'sketch_saved',
      sessionId,
      data: { timestamp: Date.now() },
    });
  }

  // Broadcast status change
  broadcastStatusChange(sessionId: string, status: Session['status']) {
    this.send({
      type: 'status_changed',
      sessionId,
      data: { status },
    });
  }
}

export const whiteboardWS = new WhiteboardWebSocket();
