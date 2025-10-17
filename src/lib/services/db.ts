import { openDB, type IDBPDatabase } from 'idb';

export type MessageType = 'text' | 'image' | 'video' | 'file';
export type ConversationType = 'room' | 'direct';

export interface MessageAttachment {
	type: 'image' | 'video' | 'file';
	url: string;
	name: string;
	size: number;
	mimeType: string;
	thumbnail?: string;
}

export interface MessageReply {
	messageId: string;
	userId: string;
	username: string;
	content: string;
}

export interface ChatMessage {
	id: string;
	conversationId: string;
	conversationType: ConversationType;
	userId: string;
	username: string;
	content: string;
	messageType: MessageType;
	timestamp: number;
	synced: boolean;
	attachments?: MessageAttachment[];
	replyTo?: MessageReply;
	mentions?: string[];
}

export interface Contact {
	id: string;
	username: string;
	avatar?: string;
	status: 'online' | 'offline' | 'away';
	lastSeen?: number;
}

export interface Conversation {
	id: string;
	type: ConversationType;
	name: string;
	participantIds?: string[];
	lastMessage?: ChatMessage;
	unreadCount: number;
}

const DB_NAME = 'chat-db';
const DB_VERSION = 2;
const MESSAGES_STORE = 'messages';
const CONTACTS_STORE = 'contacts';
const CONVERSATIONS_STORE = 'conversations';

let dbInstance: IDBPDatabase | null = null;

export async function initDB(): Promise<IDBPDatabase> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB(DB_NAME, DB_VERSION, {
		upgrade(db, oldVersion, _newVersion, transaction) {
			// Messages store
			if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
				const store = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
				store.createIndex('conversationId', 'conversationId', { unique: false });
				store.createIndex('timestamp', 'timestamp', { unique: false });
				store.createIndex('synced', 'synced', { unique: false });
				store.createIndex('conversationType', 'conversationType', { unique: false });
			} else if (oldVersion < 2 && db.objectStoreNames.contains(MESSAGES_STORE)) {
				// Migrate from roomId to conversationId
				// Use the existing transaction, don't create a new one
				const store = transaction?.objectStore(MESSAGES_STORE);
				if (store && !store.indexNames.contains('conversationId')) {
					store.createIndex('conversationId', 'conversationId', { unique: false });
				}
				if (store && !store.indexNames.contains('conversationType')) {
					store.createIndex('conversationType', 'conversationType', { unique: false });
				}
			}

			// Contacts store
			if (!db.objectStoreNames.contains(CONTACTS_STORE)) {
				const store = db.createObjectStore(CONTACTS_STORE, { keyPath: 'id' });
				store.createIndex('username', 'username', { unique: false });
				store.createIndex('status', 'status', { unique: false });
			}

			// Conversations store
			if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
				const store = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
				store.createIndex('type', 'type', { unique: false });
			}
		}
	});

	return dbInstance;
}

export async function saveMessage(message: ChatMessage): Promise<void> {
	const db = await initDB();
	await db.put(MESSAGES_STORE, message);
}

export async function getMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
	const db = await initDB();
	const tx = db.transaction(MESSAGES_STORE, 'readonly');
	const index = tx.store.index('conversationId');
	return await index.getAll(conversationId);
}

// Backward compatibility
export async function getMessagesByRoom(roomId: string): Promise<ChatMessage[]> {
	return getMessagesByConversation(roomId);
}

export async function getUnsyncedMessages(): Promise<ChatMessage[]> {
	const db = await initDB();
	const tx = db.transaction(MESSAGES_STORE, 'readonly');
	const index = tx.store.index('synced');
	const allMessages = await index.getAll();
	return allMessages.filter(msg => !msg.synced);
}

export async function markMessageAsSynced(messageId: string): Promise<void> {
	const db = await initDB();
	const message = await db.get(MESSAGES_STORE, messageId);
	if (message) {
		message.synced = true;
		await db.put(MESSAGES_STORE, message);
	}
}

export async function deleteMessage(messageId: string): Promise<void> {
	const db = await initDB();
	await db.delete(MESSAGES_STORE, messageId);
}

export async function clearAllMessages(): Promise<void> {
	const db = await initDB();
	await db.clear(MESSAGES_STORE);
}

// Contacts functions
export async function saveContact(contact: Contact): Promise<void> {
	const db = await initDB();
	await db.put(CONTACTS_STORE, contact);
}

export async function getContacts(): Promise<Contact[]> {
	const db = await initDB();
	return await db.getAll(CONTACTS_STORE);
}

export async function getContact(contactId: string): Promise<Contact | undefined> {
	const db = await initDB();
	return await db.get(CONTACTS_STORE, contactId);
}

export async function deleteContact(contactId: string): Promise<void> {
	const db = await initDB();
	await db.delete(CONTACTS_STORE, contactId);
}

// Conversations functions
export async function saveConversation(conversation: Conversation): Promise<void> {
	const db = await initDB();
	await db.put(CONVERSATIONS_STORE, conversation);
}

export async function getConversations(): Promise<Conversation[]> {
	const db = await initDB();
	return await db.getAll(CONVERSATIONS_STORE);
}

export async function getConversation(conversationId: string): Promise<Conversation | undefined> {
	const db = await initDB();
	return await db.get(CONVERSATIONS_STORE, conversationId);
}

export async function deleteConversation(conversationId: string): Promise<void> {
	const db = await initDB();
	await db.delete(CONVERSATIONS_STORE, conversationId);
}

export async function updateConversationLastMessage(
	conversationId: string,
	message: ChatMessage
): Promise<void> {
	const db = await initDB();
	const conversation = await db.get(CONVERSATIONS_STORE, conversationId);
	if (conversation) {
		conversation.lastMessage = message;
		await db.put(CONVERSATIONS_STORE, conversation);
	}
}
