<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Conversation, Contact } from '$lib/services/db';

	interface Props {
		conversations?: Conversation[];
		contacts?: Contact[];
		currentConversationId?: string | null;
		activeTab?: 'rooms' | 'contacts';
	}

	let {
		conversations = [],
		contacts = [],
		currentConversationId = null,
		activeTab = $bindable('rooms')
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		selectConversation: string;
		selectContact: string;
		changeTab: 'rooms' | 'contacts';
		createRoom: void;
		editRoom: Conversation;
		deleteRoom: Conversation;
		createContact: void;
		editContact: Contact;
		deleteContact: Contact;
	}>();

	function formatLastMessageTime(timestamp?: number): string {
		if (!timestamp) return '';

		const now = Date.now();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Date(timestamp).toLocaleDateString();
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'online':
				return 'bg-green-500';
			case 'away':
				return 'bg-yellow-500';
			default:
				return 'bg-gray-400';
		}
	}

	function handleTabChange(tab: 'rooms' | 'contacts') {
		activeTab = tab;
		dispatch('changeTab', tab);
	}

	let roomConversations = $derived(conversations.filter((c) => c.type === 'room'));
	let directConversations = $derived(conversations.filter((c) => c.type === 'direct'));
</script>

<div class="conversation-list flex flex-col h-full">
	<!-- Tabs -->
	<div class="flex border-b border-slate-200">
		<button
			class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'rooms'
				? 'text-blue-600 border-b-2 border-blue-600'
				: 'text-slate-600 hover:text-slate-900'}"
			onclick={() => handleTabChange('rooms')}
		>
			Rooms
		</button>
		<button
			class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'contacts'
				? 'text-blue-600 border-b-2 border-blue-600'
				: 'text-slate-600 hover:text-slate-900'}"
			onclick={() => handleTabChange('contacts')}
		>
			Contacts
		</button>
	</div>

	<!-- List content -->
	<div class="flex-1 overflow-y-auto">
		{#if activeTab === 'rooms'}
			<!-- Add Room Button -->
			<div class="p-2">
				<button
					class="w-full px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
					onclick={() => dispatch('createRoom')}
				>
					+ Create Room
				</button>
			</div>

			<!-- Rooms list -->
			<div class="space-y-1 px-2 pb-2">
				{#each roomConversations as conversation}
					<div class="group relative">
						<button
							class="w-full text-left px-3 py-2 rounded-lg transition-colors {currentConversationId ===
							conversation.id
								? 'bg-blue-500 text-white'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
							onclick={() => dispatch('selectConversation', conversation.id)}
						>
							<div class="flex items-center gap-2">
								<span class="text-lg">#</span>
								<div class="flex-1 min-w-0">
									<p class="font-medium truncate">{conversation.name}</p>
									{#if conversation.lastMessage}
										<p class="text-xs opacity-75 truncate">
											{conversation.lastMessage.username}: {conversation.lastMessage.content}
										</p>
									{/if}
								</div>
								{#if conversation.unreadCount > 0}
									<span
										class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center"
									>
										{conversation.unreadCount}
									</span>
								{/if}
							</div>
							{#if conversation.lastMessage}
								<p class="text-xs opacity-60 mt-1">
									{formatLastMessageTime(conversation.lastMessage.timestamp)}
								</p>
							{/if}
						</button>

						<!-- Action buttons (shown on hover) -->
						<div
							class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
						>
							<button
								class="bg-white hover:bg-slate-100 text-slate-600 rounded p-1.5 shadow-sm border border-slate-200"
								onclick={(e) => {
									e.stopPropagation();
									dispatch('editRoom', conversation);
								}}
								title="Edit room"
							>
								✏️
							</button>
							<button
								class="bg-white hover:bg-red-50 text-red-600 rounded p-1.5 shadow-sm border border-slate-200"
								onclick={(e) => {
									e.stopPropagation();
									dispatch('deleteRoom', conversation);
								}}
								title="Delete room"
							>
								🗑️
							</button>
						</div>
					</div>
				{/each}

				{#if roomConversations.length === 0}
					<div class="text-center py-8 text-slate-500">
						<p class="text-sm">No rooms yet</p>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Add Contact Button -->
			<div class="p-2">
				<button
					class="w-full px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
					onclick={() => dispatch('createContact')}
				>
					+ Add Contact
				</button>
			</div>

			<!-- Contacts list -->
			<div class="space-y-1 px-2 pb-2">
				{#each contacts as contact}
					<div class="group relative">
						<button
							class="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-slate-100"
							onclick={() => dispatch('selectContact', contact.id)}
						>
							<div class="flex items-center gap-3">
								<div class="relative">
									<div
										class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold"
									>
										{contact.username[0].toUpperCase()}
									</div>
									<div
										class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white {getStatusColor(
											contact.status
										)}"
									></div>
								</div>
								<div class="flex-1 min-w-0">
									<p class="font-medium text-slate-900 truncate">{contact.username}</p>
									<p class="text-xs text-slate-500">
										{contact.status === 'online'
											? 'Online'
											: contact.status === 'away'
												? 'Away'
												: contact.lastSeen
													? `Last seen ${formatLastMessageTime(contact.lastSeen)}`
													: 'Offline'}
									</p>
								</div>
							</div>
						</button>

						<!-- Action buttons (shown on hover) -->
						<div
							class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
						>
							<button
								class="bg-white hover:bg-slate-100 text-slate-600 rounded p-1.5 shadow-sm border border-slate-200"
								onclick={(e) => {
									e.stopPropagation();
									dispatch('editContact', contact);
								}}
								title="Edit contact"
							>
								✏️
							</button>
							<button
								class="bg-white hover:bg-red-50 text-red-600 rounded p-1.5 shadow-sm border border-slate-200"
								onclick={(e) => {
									e.stopPropagation();
									dispatch('deleteContact', contact);
								}}
								title="Delete contact"
							>
								🗑️
							</button>
						</div>
					</div>
				{/each}

				<!-- Direct message conversations -->
				{#each directConversations as conversation}
					<button
						class="w-full text-left px-3 py-2 rounded-lg transition-colors {currentConversationId ===
						conversation.id
							? 'bg-blue-500 text-white'
							: 'hover:bg-slate-100'}"
						onclick={() => dispatch('selectConversation', conversation.id)}
					>
						<div class="flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold"
							>
								{conversation.name[0].toUpperCase()}
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate">{conversation.name}</p>
								{#if conversation.lastMessage}
									<p class="text-xs opacity-75 truncate">
										{conversation.lastMessage.content}
									</p>
								{/if}
							</div>
							{#if conversation.unreadCount > 0}
								<span
									class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center"
								>
									{conversation.unreadCount}
								</span>
							{/if}
						</div>
						{#if conversation.lastMessage}
							<p class="text-xs opacity-60 mt-1">
								{formatLastMessageTime(conversation.lastMessage.timestamp)}
							</p>
						{/if}
					</button>
				{/each}

				{#if contacts.length === 0 && directConversations.length === 0}
					<div class="text-center py-8 text-slate-500">
						<p class="text-sm">No contacts yet</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
