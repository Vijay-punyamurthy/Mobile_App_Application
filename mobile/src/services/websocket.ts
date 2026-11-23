import { WS_URL, getAuthToken } from './api';

type Listener = (payload: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private isExplicitlyClosed: boolean = false;

  public async connect(): Promise<void> {
    const token = await getAuthToken();
    if (!token) {
      console.log('No auth token available, WebSocket connection deferred');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket signaling connected to LandConnect server');
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          if (type) {
            const handlers = this.listeners.get(type);
            if (handlers) {
              handlers.forEach((fn) => fn(data));
            }
          }
          // Also invoke wildcard listeners
          const wildcardHandlers = this.listeners.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach((fn) => fn(data));
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.stopPing();
        if (!this.isExplicitlyClosed) {
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };
    } catch (e) {
      console.error('WebSocket connection failure:', e);
    }
  }

  public send(data: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send WebSocket message: socket not open');
    }
  }

  public subscribe(eventType: string, listener: Listener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.delete(listener);
      }
    };
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const wsClient = new WebSocketClient();
