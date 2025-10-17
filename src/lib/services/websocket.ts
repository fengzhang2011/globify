import { saveMessage } from './db';
import type { ChatMessage } from './db';

export class WebSocketService {
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private reconnectDelay = 1000;
	private messageCallbacks: ((message: ChatMessage) => void)[] = [];
	private connectionCallbacks: ((connected: boolean) => void)[] = [];
	private shouldReconnect = true;

	constructor(private serverUrl: string = 'ws://localhost:3001') {}

	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(this.serverUrl);

				this.ws.onopen = () => {
					console.log('Connected to local WebSocket server');
					this.reconnectAttempts = 0;
					this.notifyConnectionStatus(true);
					resolve();
				};

				this.ws.onmessage = (event) => {
					this.handleIncomingMessage(event.data);
				};

				this.ws.onerror = (error) => {
					console.error('WebSocket error:', error);
					this.notifyConnectionStatus(false);
					reject(error);
				};

				this.ws.onclose = () => {
					console.log('WebSocket connection closed');
					this.notifyConnectionStatus(false);
					this.attemptReconnect();
				};
			} catch (error) {
				console.error('Failed to create WebSocket connection:', error);
				reject(error);
			}
		});
	}

	private handleIncomingMessage(data: string): void {
		try {
			const message: ChatMessage = JSON.parse(data);

			// Save to IndexedDB
			saveMessage({ ...message, synced: true }).catch(console.error);

			// Notify subscribers
			this.messageCallbacks.forEach(callback => callback(message));
		} catch (error) {
			console.error('Error handling incoming WebSocket message:', error);
		}
	}

	private attemptReconnect(): void {
		if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnect attempts reached or reconnection disabled');
			return;
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

		console.log(
			`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
		);

		setTimeout(() => {
			this.connect().catch(console.error);
		}, delay);
	}

	sendMessage(message: ChatMessage): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.warn('WebSocket not connected, saving message for later');
			saveMessage({ ...message, synced: false }).catch(console.error);
			return;
		}

		try {
			this.ws.send(JSON.stringify(message));
		} catch (error) {
			console.error('Failed to send WebSocket message:', error);
			saveMessage({ ...message, synced: false }).catch(console.error);
		}
	}

	onMessage(callback: (message: ChatMessage) => void): void {
		this.messageCallbacks.push(callback);
	}

	onConnectionChange(callback: (connected: boolean) => void): void {
		this.connectionCallbacks.push(callback);
	}

	private notifyConnectionStatus(connected: boolean): void {
		this.connectionCallbacks.forEach(callback => callback(connected));
	}

	disconnect(): void {
		this.shouldReconnect = false;
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}

// Singleton instance
let wsServiceInstance: WebSocketService | null = null;

export function getWebSocketService(serverUrl?: string): WebSocketService {
	if (!wsServiceInstance) {
		wsServiceInstance = new WebSocketService(serverUrl);
	}
	return wsServiceInstance;
}
