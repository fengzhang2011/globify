<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		chatStore,
		connectionStatus,
		messages,
		contacts as contactsStore,
		conversations as conversationsStore
	} from '$lib/stores/chat';
  import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import MessageInput from '$lib/components/chat/MessageInput.svelte';
	import MessageItem from '$lib/components/chat/MessageItem.svelte';
	import ConversationList from '$lib/components/chat/ConversationList.svelte';
	import RoomDialog from '$lib/components/chat/RoomDialog.svelte';
	import ContactDialog from '$lib/components/chat/ContactDialog.svelte';
	import DeleteConfirmDialog from '$lib/components/chat/DeleteConfirmDialog.svelte';
  import { goto } from '$app/navigation';
	import type {
		ChatMessage,
		MessageReply,
		MessageAttachment,
		Contact,
		Conversation
	} from '$lib/services/db';

	// User state (in production, this would come from auth)
	let userId = $state('user-' + Math.random().toString(36).slice(2, 9));
	let username = $state('User ' + Math.floor(Math.random() * 1000));
	let currentConversationId = $state<string | null>(null);
	let currentConversationType = $state<'room' | 'direct'>('room');
	let currentConversationName = $state('');
	let replyingTo = $state<MessageReply | null>(null);
	let messagesContainer = $state<HTMLDivElement | undefined>(undefined);
	let activeTab = $state<'rooms' | 'contacts'>('rooms');

	// Dialog states
	let showRoomDialog = $state(false);
	let showContactDialog = $state(false);
	let showDeleteDialog = $state(false);
	let editingRoom = $state<Conversation | null>(null);
	let editingContact = $state<Contact | null>(null);
	let deletingItem = $state<{ type: 'room' | 'contact'; item: Conversation | Contact } | null>(
		null
	);
	let roomDialogMode = $state<'create' | 'edit'>('create');
	let contactDialogMode = $state<'create' | 'edit'>('create');

	// Subscribe to stores
	let connectionState = $derived($connectionStatus);
	let chatMessages = $derived($messages);
	let contactsList = $derived($contactsStore);
	let conversationsList = $derived($conversationsStore);

	onMount(async () => {
    await chatStore.loadConversations();
    return;
		// Initialize demo data first (works offline)
		await initializeDemoData();

		// Then initialize chat services (may fail if servers are down)
		await chatStore.initialize(
			'ws://localhost:8083/mqtt', // NanoMQ WebSocket URL
			'ws://localhost:3001' // Local uWebSockets.js server URL
		);

		// Join default room after everything is loaded
		const defaultRoom = conversationsList.find((c) => c.type === 'room');
		if (defaultRoom) {
			currentConversationId = defaultRoom.id;
			currentConversationName = defaultRoom.name;
			currentConversationType = 'room';
			await chatStore.joinConversation(defaultRoom.id, 'room');
		}
	});

	onDestroy(() => {
		chatStore.disconnect();
	});

	async function initializeDemoData() {
		// Load existing data first
		await chatStore.loadConversations();
		await chatStore.loadContacts();

		// Create default rooms if they don't exist
		const defaultRooms = ['general', 'development', 'random', 'announcements'];

		for (const room of defaultRooms) {
			const exists = conversationsList.some((c) => c.id === room && c.type === 'room');
			if (!exists) {
				await chatStore.createConversation({
					id: room,
					type: 'room',
					name: room,
					unreadCount: 0
				});
			}
		}

		// Create some demo contacts if they don't exist
		const demoContacts: Contact[] = [
			{ id: 'user-alice', username: 'Alice', status: 'online' },
			{ id: 'user-bob', username: 'Bob', status: 'away' },
			{ id: 'user-charlie', username: 'Charlie', status: 'offline', lastSeen: Date.now() - 3600000 }
		];

		for (const contact of demoContacts) {
			const exists = contactsList.some((c) => c.id === contact.id);
			if (!exists) {
				await chatStore.addContact(contact);
			}
		}

		// Reload data to ensure UI is updated
		await chatStore.loadConversations();
		await chatStore.loadContacts();

		// Add example messages to demonstrate the chat
		await addExampleMessages();
	}

	async function addExampleMessages() {
		// Check if example message already exists in IndexedDB
		const { getMessagesByConversation, saveMessage } = await import('$lib/services/db');
		const existingMessages = await getMessagesByConversation('general');

		const exampleId = 'example-welcome-message';
		const hasExampleMessage = existingMessages.some((m) => m.id === exampleId);

		if (!hasExampleMessage) {
			// Create and save example message directly to IndexedDB
			const exampleMessage: ChatMessage = {
				id: exampleId,
				conversationId: 'general',
				conversationType: 'room',
				userId: 'user-alice',
				username: 'Alice',
				content: 'Welcome to Globify Chat! 👋 Try creating rooms, adding contacts, and sending messages with @mentions, images, and emojis!',
				messageType: 'text',
				timestamp: Date.now() - 60000, // 1 minute ago
				synced: true
			};

			await saveMessage(exampleMessage);
		}
	}

	async function handleSendMessage(content: string) {
		if (!content.trim()) return;

		// Extract mentions from message
		const mentionRegex = /@(\w+)/g;
		const mentions: string[] = [];
		let match;
		while ((match = mentionRegex.exec(content)) !== null) {
			mentions.push(match[1]);
		}

		await chatStore.sendMessage(content, userId, username, {
			...(replyingTo && { replyTo: replyingTo }),
			...(mentions.length > 0 && { mentions })
		});

		replyingTo = null;
		scrollToBottom();
	}

	async function handleUpload(event: CustomEvent<{ files: FileList; type: 'image' | 'video' }>) {
		const { files, type } = event.detail;

		// In production, upload files to server and get URLs
		// For demo, create object URLs
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const url = URL.createObjectURL(file);

			const attachment: MessageAttachment = {
				type: type,
				url: url,
				name: file.name,
				size: file.size,
				mimeType: file.type
			};

			await chatStore.sendMessage(
				type === 'image' ? '📷 Image' : '🎥 Video',
				userId,
				username,
				{
					attachments: [attachment]
				}
			);
		}

		scrollToBottom();
	}

	function handleReply(event: CustomEvent<ChatMessage>) {
		const message = event.detail;
		replyingTo = {
			messageId: message.id,
			userId: message.userId,
			username: message.username,
			content: message.content
		};
	}

	function handleCancelReply() {
		replyingTo = null;
	}

	async function handleSelectConversation(event: CustomEvent<string>) {
		const conversationId = event.detail;
		const conversation = conversationsList.find((c) => c.id === conversationId);
		if (!conversation) return;

		await chatStore.leaveConversation();
		currentConversationId = conversationId;
		currentConversationName = conversation.name;
		currentConversationType = conversation.type;
		await chatStore.joinConversation(conversationId, conversation.type);
		scrollToBottom();
	}

	async function handleSelectContact(event: CustomEvent<string>) {
		const contactId = event.detail;
		const contact = contactsList.find((c) => c.id === contactId);
		if (!contact) return;

		// Check if conversation with this contact already exists
		let conversation = conversationsList.find(
			(c) => c.type === 'direct' && c.participantIds?.includes(contactId)
		);

		if (!conversation) {
			// Create new direct conversation
			const conversationId = `dm-${userId}-${contactId}`;
			conversation = {
				id: conversationId,
				type: 'direct',
				name: contact.username,
				participantIds: [userId, contactId],
				unreadCount: 0
			};
			await chatStore.createConversation(conversation);
			await chatStore.loadConversations();
		}

		await chatStore.leaveConversation();
		currentConversationId = conversation.id;
		currentConversationName = conversation.name;
		currentConversationType = 'direct';
		await chatStore.joinConversation(conversation.id, 'direct');
		scrollToBottom();
	}

	function handleTabChange(event: CustomEvent<'rooms' | 'contacts'>) {
		activeTab = event.detail;
	}

	// Room CRUD handlers
	function handleCreateRoom() {
		editingRoom = null;
		roomDialogMode = 'create';
		showRoomDialog = true;
	}

	function handleEditRoom(event: CustomEvent<Conversation>) {
		editingRoom = event.detail;
		roomDialogMode = 'edit';
		showRoomDialog = true;
	}

	function handleDeleteRoom(event: CustomEvent<Conversation>) {
		deletingItem = { type: 'room', item: event.detail };
		showDeleteDialog = true;
	}

	async function handleSaveRoom(event: CustomEvent<{ id: string; name: string }>) {
		const { id, name } = event.detail;

		if (roomDialogMode === 'create') {
			await chatStore.createConversation({
				id,
				type: 'room',
				name,
				unreadCount: 0
			});
		} else if (editingRoom) {
			await chatStore.updateConversation({
				...editingRoom,
				name
			});
		}

		await chatStore.loadConversations();
		showRoomDialog = false;
		editingRoom = null;
	}

	// Contact CRUD handlers
	function handleCreateContact() {
		editingContact = null;
		contactDialogMode = 'create';
		showContactDialog = true;
	}

	function handleEditContact(event: CustomEvent<Contact>) {
		editingContact = event.detail;
		contactDialogMode = 'edit';
		showContactDialog = true;
	}

	function handleDeleteContact(event: CustomEvent<Contact>) {
		deletingItem = { type: 'contact', item: event.detail };
		showDeleteDialog = true;
	}

	async function handleSaveContact(
		event: CustomEvent<{ id: string; username: string; status: 'online' | 'offline' | 'away' }>
	) {
		const { id, username, status } = event.detail;

		if (contactDialogMode === 'create') {
			await chatStore.addContact({
				id,
				username,
				status
			});
		} else if (editingContact) {
			await chatStore.updateContact({
				...editingContact,
				username,
				status
			});
		}

		await chatStore.loadContacts();
		showContactDialog = false;
		editingContact = null;
	}

	// Delete confirmation handler
	async function handleConfirmDelete() {
		if (!deletingItem) return;

		if (deletingItem.type === 'room') {
			const conversation = deletingItem.item as Conversation;
			await chatStore.removeConversation(conversation.id);
			await chatStore.loadConversations();

			// If we're currently in this room, leave it
			if (currentConversationId === conversation.id) {
				await chatStore.leaveConversation();
				currentConversationId = null;
				currentConversationName = '';
			}
		} else {
			const contact = deletingItem.item as Contact;
			await chatStore.removeContact(contact.id);
			await chatStore.loadContacts();
		}

		showDeleteDialog = false;
		deletingItem = null;
	}

	function scrollToBottom() {
		setTimeout(() => {
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		}, 50);
	}

	$effect(() => {
		if (chatMessages.length) {
			scrollToBottom();
		}
	});
</script>

<svelte:head>
	<title>Globify Chat - Real-time Messaging</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 flex flex-col">
  <!-- Header -->
  <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" onclick={() => goto('/')}>
            ←
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Globify Chat</h1>
            <p class="text-sm text-slate-600">Real-time messaging with MQTT & WebSockets</p>
          </div>
        </div>
        <!-- Connection Status -->
        <div class="flex gap-3">
          <Badge variant={connectionState.mqtt ? 'default' : 'secondary'}>
            <span class="mr-2">{connectionState.mqtt ? '🟢' : '🔴'}</span>
            MQTT {connectionState.mqtt ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge variant={connectionState.ws ? 'default' : 'secondary'}>
            <span class="mr-2">{connectionState.ws ? '🟢' : '🔴'}</span>
            WebSocket {connectionState.ws ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>
    </div>
  </div>

	<!-- Main Content -->
	<div class="flex-1 flex max-w-7xl mx-auto w-full p-6 gap-4 overflow-hidden">
		<!-- Sidebar - Conversation List -->
		<Card class="w-80 flex flex-col overflow-hidden">
			<ConversationList
				conversations={conversationsList}
				contacts={contactsList}
				currentConversationId={currentConversationId}
				{activeTab}
				on:selectConversation={handleSelectConversation}
				on:selectContact={handleSelectContact}
				on:changeTab={handleTabChange}
				on:createRoom={handleCreateRoom}
				on:editRoom={handleEditRoom}
				on:deleteRoom={handleDeleteRoom}
				on:createContact={handleCreateContact}
				on:editContact={handleEditContact}
				on:deleteContact={handleDeleteContact}
			/>
		</Card>

		<!-- Chat Area -->
		<div class="flex-1 flex flex-col min-w-0">
			<Card class="flex-1 flex flex-col overflow-hidden">
				{#if currentConversationId}
					<!-- Conversation Header -->
					<div class="px-6 py-4 border-b border-slate-200 bg-white">
						<div class="flex items-center gap-3">
							<div class="text-2xl">
								{currentConversationType === 'room' ? '#' : '💬'}
							</div>
							<div class="flex-1">
								<h2 class="text-xl font-semibold text-slate-900">
									{currentConversationName}
								</h2>
								<p class="text-sm text-slate-600">
									{currentConversationType === 'room' ? 'Group chat' : 'Direct message'} •
									{chatMessages.length} messages
								</p>
							</div>
						</div>
					</div>

					<!-- Messages -->
					<div bind:this={messagesContainer} class="flex-1 overflow-y-auto px-6 py-4 space-y-2">
						{#if chatMessages.length === 0}
							<div class="flex items-center justify-center h-full text-slate-500">
								<div class="text-center">
									<p class="text-lg mb-2">No messages yet</p>
									<p class="text-sm">Be the first to say hello!</p>
								</div>
							</div>
						{:else}
							{#each chatMessages as message (message.id)}
								<MessageItem
									{message}
									isOwn={message.userId === userId}
									on:reply={handleReply}
								/>
							{/each}
						{/if}
					</div>

					<!-- Message Input -->
					<MessageInput
						on:send={(e) => handleSendMessage(e.detail)}
						on:upload={handleUpload}
						on:cancelReply={handleCancelReply}
						{replyingTo}
					/>
				{:else}
					<!-- No conversation selected -->
					<div class="flex items-center justify-center h-full text-slate-500">
						<div class="text-center">
							<p class="text-lg mb-2">Welcome to Globify Chat</p>
							<p class="text-sm">Select a room or contact to start chatting</p>
						</div>
					</div>
				{/if}
			</Card>
		</div>

		<!-- User Info Sidebar -->
		<Card class="w-64 p-4">
			<h3 class="text-lg font-semibold mb-4 text-slate-900">Current User</h3>
			<div class="flex flex-col items-center gap-3">
				<div
					class="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-3xl font-semibold"
				>
					{username[0].toUpperCase()}
				</div>
				<div class="text-center">
					<p class="font-semibold text-slate-900">{username}</p>
					<p class="text-xs text-slate-500 truncate">{userId}</p>
				</div>
			</div>

			<div class="mt-6 pt-4 border-t border-slate-200">
				<h4 class="text-sm font-semibold text-slate-700 mb-2">Quick Tips</h4>
				<ul class="text-xs text-slate-600 space-y-2">
					<li>• Use @ to mention someone</li>
					<li>• Click reply to quote a message</li>
					<li>• Upload images and videos</li>
					<li>• Press Enter to send</li>
					<li>• Shift+Enter for new line</li>
				</ul>
			</div>
		</Card>
	</div>

	<!-- Footer -->
	<div class="bg-white/80 backdrop-blur-sm border-t border-slate-200 px-6 py-3 text-center">
		<p class="text-sm text-slate-500">
			Powered by SvelteKit • MQTT (NanoMQ) • WebSockets (uWebSockets.js) • IndexedDB
		</p>
	</div>
</div>

<!-- Dialogs -->
<RoomDialog
	bind:open={showRoomDialog}
	room={editingRoom}
	mode={roomDialogMode}
	on:save={handleSaveRoom}
/>

<ContactDialog
	bind:open={showContactDialog}
	contact={editingContact}
	mode={contactDialogMode}
	on:save={handleSaveContact}
/>

<DeleteConfirmDialog
	bind:open={showDeleteDialog}
	title={deletingItem?.type === 'room' ? 'Delete Room' : 'Delete Contact'}
	message={deletingItem
		? deletingItem.type === 'room'
			? `Are you sure you want to delete the room "${(deletingItem.item as Conversation).name}"? All messages will be removed.`
			: `Are you sure you want to delete the contact "${(deletingItem.item as Contact).username}"?`
		: ''}
	on:confirm={handleConfirmDelete}
/>
