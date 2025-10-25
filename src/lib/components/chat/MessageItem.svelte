<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ChatMessage } from '$lib/services/db';

	interface Props {
		message: ChatMessage;
		isOwn?: boolean;
	}

	let { message, isOwn = false }: Props = $props();

	const dispatch = createEventDispatcher<{ reply: ChatMessage }>();

	function formatTime(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleReply() {
		dispatch('reply', message);
	}

	function renderContentWithMentions(content: string): string {
		if (!message.mentions || message.mentions.length === 0) {
			return content;
		}

		let result = content;
		message.mentions.forEach((mention) => {
			const mentionRegex = new RegExp(`@${mention}\\b`, 'g');
			result = result.replace(
				mentionRegex,
				`<span class="mention">@${mention}</span>`
			);
		});
		return result;
	}
</script>

<div class="message-item flex gap-3 group hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors">
	<!-- Avatar -->
	<div
		class="w-10 h-10 rounded-full bg-gradient-to-br {isOwn
			? 'from-green-500 to-green-600'
			: 'from-blue-500 to-purple-500'} flex items-center justify-center text-white font-semibold flex-shrink-0"
	>
		{message.username[0].toUpperCase()}
	</div>

	<!-- Message Content -->
	<div class="flex-1 min-w-0">
		<div class="flex items-baseline gap-2 mb-1">
			<span class="font-semibold text-slate-900">{message.username}</span>
			<span class="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
			{#if !message.synced}
				<span class="text-xs text-yellow-600">⏳ Sending...</span>
			{/if}

			<!-- Reply button (shown on hover) -->
			<button
				onclick={handleReply}
				class="ml-auto opacity-0 group-hover:opacity-100 text-xs text-slate-500 hover:text-blue-600 transition-opacity"
				title="Reply"
			>
				↩️ Reply
			</button>
		</div>

		<!-- Reply context -->
		{#if message.replyTo}
			<div class="reply-context bg-slate-100 border-l-2 border-slate-400 pl-3 py-1 mb-2 rounded">
				<p class="text-xs font-semibold text-slate-600">
					{message.replyTo.username}
				</p>
				<p class="text-xs text-slate-500 truncate">{message.replyTo.content}</p>
			</div>
		{/if}

		<!-- Message text -->
		<div class="text-slate-700 break-words">
			{@html renderContentWithMentions(message.content)}
		</div>

		<!-- Attachments -->
		{#if message.attachments && message.attachments.length > 0}
			<div class="attachments mt-2 space-y-2">
				{#each message.attachments as attachment}
					{#if attachment.type === 'image'}
						<div class="image-attachment">
							<button
								type="button"
								onclick={() => window.open(attachment.url, '_blank')}
								class="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
								aria-label="Open image in new tab"
							>
								<img
									src={attachment.url}
									alt={attachment.name}
									class="rounded-lg max-w-sm max-h-96 object-cover hover:opacity-90 transition-opacity"
								/>
							</button>
							<p class="text-xs text-slate-500 mt-1">{attachment.name}</p>
						</div>
					{:else if attachment.type === 'video'}
						<div class="video-attachment">
							<video
								src={attachment.url}
								controls
								class="rounded-lg max-w-sm max-h-96"
								poster={attachment.thumbnail}
							>
								<track kind="captions" />
							</video>
							<p class="text-xs text-slate-500 mt-1">{attachment.name}</p>
						</div>
					{:else}
						<div class="file-attachment bg-slate-100 rounded-lg p-3 max-w-sm">
							<div class="flex items-center gap-2">
								<span class="text-2xl">📎</span>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-slate-900 truncate">
										{attachment.name}
									</p>
									<p class="text-xs text-slate-500">
										{(attachment.size / 1024 / 1024).toFixed(2)} MB
									</p>
								</div>
								<a
									href={attachment.url}
									download={attachment.name}
									class="text-blue-600 hover:text-blue-700"
									title="Download"
								>
									⬇️
								</a>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.mention) {
		color: #2563eb;
		font-weight: 600;
		background-color: #dbeafe;
		padding: 0 4px;
		border-radius: 3px;
	}

	.reply-context {
		font-size: 0.875rem;
	}
</style>
