<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import type { MessageReply } from '$lib/services/db';
	import EmojiPicker from './EmojiPicker.svelte';

	interface Props {
		value?: string;
		replyingTo?: MessageReply | null;
		disabled?: boolean;
	}

	let { value = $bindable(''), replyingTo = $bindable(null), disabled = false }: Props = $props();

	const dispatch = createEventDispatcher<{
		send: string;
		cancelReply: void;
		upload: { files: FileList; type: 'image' | 'video' };
	}>();

	let showEmojiPicker = $state(false);
	let textareaElement: HTMLTextAreaElement;
	let imageInput: HTMLInputElement;
	let videoInput: HTMLInputElement;

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function handleSend() {
		if (!value.trim()) return;
		dispatch('send', value);
		value = '';
		if (textareaElement) {
			textareaElement.style.height = 'auto';
		}
	}

	function handleEmojiSelect(event: CustomEvent<string>) {
		value += event.detail;
		showEmojiPicker = false;
		textareaElement?.focus();
	}

	function handleInput() {
		if (textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = textareaElement.scrollHeight + 'px';
		}
	}

	function handleImageUpload() {
		imageInput.click();
	}

	function handleVideoUpload() {
		videoInput.click();
	}

	function onImageSelected(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			dispatch('upload', { files: target.files, type: 'image' });
			target.value = '';
		}
	}

	function onVideoSelected(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			dispatch('upload', { files: target.files, type: 'video' });
			target.value = '';
		}
	}

	function cancelReply() {
		dispatch('cancelReply');
	}

	function insertMention() {
		value += '@';
		textareaElement?.focus();
	}
</script>

<div class="message-input-container">
	{#if replyingTo}
		<div class="reply-preview bg-slate-100 px-4 py-2 border-l-4 border-blue-500 flex items-center justify-between">
			<div class="flex-1 min-w-0">
				<p class="text-xs font-semibold text-slate-700">
					Replying to {replyingTo.username}
				</p>
				<p class="text-xs text-slate-600 truncate">{replyingTo.content}</p>
			</div>
			<button
				onclick={cancelReply}
				class="ml-2 text-slate-500 hover:text-slate-700"
				aria-label="Cancel reply"
			>
				✕
			</button>
		</div>
	{/if}

	<div class="flex gap-2 p-4 border-t border-slate-200">
		<!-- Attachment buttons -->
		<div class="flex gap-1">
			<Button
				variant="ghost"
				size="icon"
				onclick={handleImageUpload}
				title="Upload image"
				class="h-9 w-9"
			>
				🖼️
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onclick={handleVideoUpload}
				title="Upload video"
				class="h-9 w-9"
			>
				🎥
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onclick={insertMention}
				title="Mention someone"
				class="h-9 w-9"
			>
				@
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onclick={() => (showEmojiPicker = !showEmojiPicker)}
				title="Add emoji"
				class="h-9 w-9"
			>
				😀
			</Button>
		</div>

		<!-- Text input -->
		<textarea
			bind:this={textareaElement}
			bind:value
			onkeypress={handleKeyPress}
			oninput={handleInput}
			placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
			class="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
			rows="1"
			{disabled}
		></textarea>

		<!-- Send button -->
		<Button onclick={handleSend} disabled={!value.trim() || disabled} class="h-9">
			Send
		</Button>
	</div>

	{#if showEmojiPicker}
		<div class="emoji-picker-wrapper absolute bottom-full mb-2 right-4 z-50">
			<EmojiPicker on:select={handleEmojiSelect} />
		</div>
	{/if}
</div>

<!-- Hidden file inputs -->
<input
	bind:this={imageInput}
	type="file"
	accept="image/*"
	multiple
	class="hidden"
	onchange={onImageSelected}
/>
<input
	bind:this={videoInput}
	type="file"
	accept="video/*"
	multiple
	class="hidden"
	onchange={onVideoSelected}
/>

<style>
	.message-input-container {
		position: relative;
	}

	textarea {
		font-family: inherit;
		line-height: 1.5;
	}

	.emoji-picker-wrapper {
		animation: slideUp 0.2s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
