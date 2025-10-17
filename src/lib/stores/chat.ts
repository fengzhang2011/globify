import { writable, derived, get } from 'svelte/store';
import { getMQTTService } from '$lib/services/mqtt';
import { getWebSocketService } from '$lib/services/websocket';
import {
	getMessagesByConversation,
	saveMessage,
	getContacts,
	saveContact,
	deleteContact,
	getConversations,
	saveConversation,
	deleteConversation,
	updateConversationLastMessage
} from '$lib/services/db';
import type {
	ChatMessage,
	Contact,
	Conversation,
	MessageReply,
	MessageAttachment,
	ConversationType
} from '$lib/services/db';

export interface ChatState {
	currentConversationId: string | null;
	currentConversationType: ConversationType | null;
	messages: ChatMessage[];
	contacts: Contact[];
	conversations: Conversation[];
	mqttConnected: boolean;
	wsConnected: boolean;
	loading: boolean;
	error: string | null;
}

const initialState: ChatState = {
	currentConversationId: null,
	currentConversationType: null,
	messages: [],
	contacts: [],
	conversations: [],
	mqttConnected: false,
	wsConnected: false,
	loading: false,
	error: null
};

function createChatStore() {
	const { subscribe, set, update } = writable<ChatState>(initialState);

	let mqttService = getMQTTService();
	let wsService = getWebSocketService();

	// Subscribe to MQTT messages
	mqttService.onMessage((message: ChatMessage) => {
		update((state) => {
			// Only add if it's for the current conversation and not a duplicate
			if (message.conversationId === state.currentConversationId) {
				const exists = state.messages.some((m) => m.id === message.id);
				if (!exists) {
					// Update conversation last message
					updateConversationLastMessage(message.conversationId, message).catch(console.error);

					return {
						...state,
						messages: [...state.messages, message].sort((a, b) => a.timestamp - b.timestamp)
					};
				}
			}
			return state;
		});
	});

	// Subscribe to WebSocket messages
	wsService.onMessage((message: ChatMessage) => {
		update((state) => {
			if (message.conversationId === state.currentConversationId) {
				const exists = state.messages.some((m) => m.id === message.id);
				if (!exists) {
					// Update conversation last message
					updateConversationLastMessage(message.conversationId, message).catch(console.error);

					return {
						...state,
						messages: [...state.messages, message].sort((a, b) => a.timestamp - b.timestamp)
					};
				}
			}
			return state;
		});
	});

	// Track connection status
	mqttService.onConnectionChange((connected: boolean) => {
		update((state) => ({ ...state, mqttConnected: connected }));
	});

	wsService.onConnectionChange((connected: boolean) => {
		update((state) => ({ ...state, wsConnected: connected }));
	});

	return {
		subscribe,
		set,
		update,

		async initialize(mqttBrokerUrl?: string, wsServerUrl?: string) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				// Initialize services with custom URLs if provided
				if (mqttBrokerUrl) {
					mqttService = getMQTTService(mqttBrokerUrl);
				}
				if (wsServerUrl) {
					wsService = getWebSocketService(wsServerUrl);
				}

				// Connect to both services
				await Promise.all([
					mqttService.connect().catch((err) => console.error('MQTT connection failed:', err)),
					wsService.connect().catch((err) => console.error('WebSocket connection failed:', err))
				]);

				// Load contacts and conversations
				const [contacts, conversations] = await Promise.all([
					getContacts(),
					getConversations()
				]);

				update((state) => ({
					...state,
					loading: false,
					contacts,
					conversations
				}));
			} catch (error) {
				console.error('Failed to initialize chat services:', error);
				update((state) => ({
					...state,
					loading: false,
					error: error instanceof Error ? error.message : 'Failed to initialize'
				}));
			}
		},

		async joinConversation(conversationId: string, type: ConversationType) {
			update((state) => ({
				...state,
				loading: true,
				currentConversationId: conversationId,
				currentConversationType: type
			}));

			try {
				// Subscribe to MQTT topic for rooms
				if (type === 'room') {
					mqttService.subscribeToRoom(conversationId);
				}

				// Load messages from IndexedDB
				const messages = await getMessagesByConversation(conversationId);

				update((state) => ({
					...state,
					messages: messages.sort((a, b) => a.timestamp - b.timestamp),
					loading: false
				}));
			} catch (error) {
				console.error('Failed to join conversation:', error);
				update((state) => ({
					...state,
					loading: false,
					error: error instanceof Error ? error.message : 'Failed to join conversation'
				}));
			}
		},

		async leaveConversation() {
			const state = get({ subscribe });
			if (state.currentConversationId && state.currentConversationType === 'room') {
				mqttService.unsubscribeFromRoom(state.currentConversationId);
			}

			update((state) => ({
				...state,
				currentConversationId: null,
				currentConversationType: null,
				messages: []
			}));
		},

		async sendMessage(
			content: string,
			userId: string,
			username: string,
			options?: {
				replyTo?: MessageReply;
				attachments?: MessageAttachment[];
				mentions?: string[];
			}
		) {
			const state = get({ subscribe });
			if (!state.currentConversationId || !state.currentConversationType) {
				console.error('No conversation selected');
				return;
			}

			const message: ChatMessage = {
				id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
				conversationId: state.currentConversationId,
				conversationType: state.currentConversationType,
				userId,
				username,
				content,
				messageType: options?.attachments?.length ? options.attachments[0].type : 'text',
				timestamp: Date.now(),
				synced: false,
				...(options?.replyTo && { replyTo: options.replyTo }),
				...(options?.attachments && { attachments: options.attachments }),
				...(options?.mentions && { mentions: options.mentions })
			};

			// Optimistically add to UI
			update((state) => ({
				...state,
				messages: [...state.messages, message].sort((a, b) => a.timestamp - b.timestamp)
			}));

			// Save to IndexedDB
			await saveMessage(message);

			// Update conversation last message
			await updateConversationLastMessage(state.currentConversationId, message);

			// Publish via MQTT (cross-server) for rooms
			if (state.currentConversationType === 'room') {
				mqttService.publishMessage(state.currentConversationId, message);
			}

			// Send via WebSocket (local server)
			wsService.sendMessage(message);
		},

		async addContact(contact: Contact) {
			await saveContact(contact);
			update((state) => ({
				...state,
				contacts: [...state.contacts, contact]
			}));
		},

		async updateContact(contact: Contact) {
			await saveContact(contact);
			update((state) => ({
				...state,
				contacts: state.contacts.map((c) => (c.id === contact.id ? contact : c))
			}));
		},

		async removeContact(contactId: string) {
			await deleteContact(contactId);
			update((state) => ({
				...state,
				contacts: state.contacts.filter((c) => c.id !== contactId)
			}));
		},

		async createConversation(conversation: Conversation) {
			await saveConversation(conversation);
			update((state) => ({
				...state,
				conversations: [...state.conversations, conversation]
			}));
		},

		async updateConversation(conversation: Conversation) {
			await saveConversation(conversation);
			update((state) => ({
				...state,
				conversations: state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
			}));
		},

		async removeConversation(conversationId: string) {
			await deleteConversation(conversationId);
			update((state) => ({
				...state,
				conversations: state.conversations.filter((c) => c.id !== conversationId)
			}));
		},

		async loadContacts() {
			const contacts = await getContacts();
			update((state) => ({ ...state, contacts }));
		},

		async loadConversations() {
			const conversations = await getConversations();
			update((state) => ({ ...state, conversations }));
		},

		clearError() {
			update((state) => ({ ...state, error: null }));
		},

		disconnect() {
			mqttService.disconnect();
			wsService.disconnect();
			set(initialState);
		}
	};
}

export const chatStore = createChatStore();

// Derived stores for convenience
export const currentConversation = derived(chatStore, ($store) => $store.currentConversationId);
export const messages = derived(chatStore, ($store) => $store.messages);
export const contacts = derived(chatStore, ($store) => $store.contacts);
export const conversations = derived(chatStore, ($store) => $store.conversations);
export const isConnected = derived(
	chatStore,
	($store) => $store.mqttConnected || $store.wsConnected
);
export const connectionStatus = derived(chatStore, ($store) => ({
	mqtt: $store.mqttConnected,
	ws: $store.wsConnected
}));
