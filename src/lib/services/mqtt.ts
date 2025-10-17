import mqtt, { type MqttClient } from 'mqtt';
import { saveMessage, markMessageAsSynced, getUnsyncedMessages } from './db';
import type { ChatMessage } from './db';

export class MQTTService {
	private client: MqttClient | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private reconnectDelay = 1000;
	private subscribedRooms = new Set<string>();
	private messageCallbacks: ((message: ChatMessage) => void)[] = [];
	private connectionCallbacks: ((connected: boolean) => void)[] = [];

	constructor(
		private brokerUrl: string = 'ws://localhost:8083/mqtt',
		private clientId: string = `chat-client-${Math.random().toString(16).slice(2, 10)}`
	) {}

	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.client = mqtt.connect(this.brokerUrl, {
					clientId: this.clientId,
					clean: true,
					reconnectPeriod: 1000,
					connectTimeout: 30000,
					keepalive: 60,
					protocol: 'ws'
				});

				this.client.on('connect', () => {
					console.log('Connected to MQTT broker');
					this.reconnectAttempts = 0;
					this.notifyConnectionStatus(true);
					this.resubscribeToRooms();
					this.syncUnsyncedMessages();
					resolve();
				});

				this.client.on('error', (error) => {
					console.error('MQTT connection error:', error);
					this.notifyConnectionStatus(false);
					reject(error);
				});

				this.client.on('offline', () => {
					console.log('MQTT client offline');
					this.notifyConnectionStatus(false);
				});

				this.client.on('reconnect', () => {
					this.reconnectAttempts++;
					console.log(`Reconnecting to MQTT broker (attempt ${this.reconnectAttempts})`);

					if (this.reconnectAttempts > this.maxReconnectAttempts) {
						console.error('Max reconnect attempts reached');
						this.client?.end();
					}
				});

				this.client.on('message', (topic, payload) => {
					this.handleIncomingMessage(topic, payload);
				});
			} catch (error) {
				console.error('Failed to create MQTT client:', error);
				reject(error);
			}
		});
	}

	private handleIncomingMessage(topic: string, payload: Buffer): void {
		try {
			const message: ChatMessage = JSON.parse(payload.toString());

			// Save to IndexedDB
			saveMessage({ ...message, synced: true }).catch(console.error);

			// Notify subscribers
			this.messageCallbacks.forEach(callback => callback(message));
		} catch (error) {
			console.error('Error handling incoming message:', error);
		}
	}

	subscribeToRoom(roomId: string): void {
		if (!this.client || !this.client.connected) {
			console.warn('MQTT client not connected, queuing subscription');
			this.subscribedRooms.add(roomId);
			return;
		}

		const topic = `chat/room/${roomId}`;
		this.client.subscribe(topic, { qos: 1 }, (error) => {
			if (error) {
				console.error(`Failed to subscribe to ${topic}:`, error);
			} else {
				console.log(`Subscribed to ${topic}`);
				this.subscribedRooms.add(roomId);
			}
		});
	}

	unsubscribeFromRoom(roomId: string): void {
		if (!this.client) return;

		const topic = `chat/room/${roomId}`;
		this.client.unsubscribe(topic, (error) => {
			if (error) {
				console.error(`Failed to unsubscribe from ${topic}:`, error);
			} else {
				console.log(`Unsubscribed from ${topic}`);
				this.subscribedRooms.delete(roomId);
			}
		});
	}

	private resubscribeToRooms(): void {
		this.subscribedRooms.forEach(roomId => {
			this.subscribeToRoom(roomId);
		});
	}

	publishMessage(conversationId: string, message: ChatMessage): void {
		const topic = `chat/room/${conversationId}`;
		const payload = JSON.stringify(message);

		if (!this.client || !this.client.connected) {
			console.warn('MQTT client not connected, saving message for later sync');
			saveMessage({ ...message, synced: false }).catch(console.error);
			return;
		}

		this.client.publish(topic, payload, { qos: 1, retain: false }, (error) => {
			if (error) {
				console.error('Failed to publish message:', error);
				saveMessage({ ...message, synced: false }).catch(console.error);
			} else {
				console.log('Message published successfully');
				markMessageAsSynced(message.id).catch(console.error);
			}
		});
	}

	private async syncUnsyncedMessages(): Promise<void> {
		try {
			const unsyncedMessages = await getUnsyncedMessages();
			console.log(`Syncing ${unsyncedMessages.length} unsynced messages`);

			for (const message of unsyncedMessages) {
				this.publishMessage(message.conversationId, message);
			}
		} catch (error) {
			console.error('Error syncing unsynced messages:', error);
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
		if (this.client) {
			this.client.end();
			this.client = null;
		}
	}

	isConnected(): boolean {
		return this.client?.connected ?? false;
	}
}

// Singleton instance
let mqttServiceInstance: MQTTService | null = null;

export function getMQTTService(brokerUrl?: string): MQTTService {
	if (!mqttServiceInstance) {
		mqttServiceInstance = new MQTTService(brokerUrl);
	}
	return mqttServiceInstance;
}
