<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { Conversation } from '$lib/services/db';

	interface Props {
		open?: boolean;
		room?: Conversation | null;
		mode?: 'create' | 'edit';
	}

	let { open = $bindable(false), room = null, mode = 'create' }: Props = $props();

	const dispatch = createEventDispatcher<{
		save: { id: string; name: string };
		cancel: void;
	}>();

	let roomName = $state(room?.name || '');
	let roomId = $state(room?.id || '');

	$effect(() => {
		if (room) {
			roomName = room.name;
			roomId = room.id;
		} else {
			roomName = '';
			roomId = '';
		}
	});

	function handleSave() {
		if (!roomName.trim()) return;

		const id = mode === 'create' ? roomName.toLowerCase().replace(/\s+/g, '-') : roomId;

		dispatch('save', { id, name: roomName.trim() });
		handleClose();
	}

	function handleClose() {
		open = false;
		roomName = '';
		roomId = '';
		dispatch('cancel');
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSave();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50" onclick={handleClose}></div>

		<!-- Dialog -->
		<div class="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
			<h2 class="text-xl font-semibold text-slate-900 mb-4">
				{mode === 'create' ? 'Create New Room' : 'Edit Room'}
			</h2>

			<div class="space-y-4">
				<div>
					<label for="room-name" class="block text-sm font-medium text-slate-700 mb-1">
						Room Name
					</label>
					<Input
						id="room-name"
						bind:value={roomName}
						onkeydown={handleKeyPress}
						placeholder="e.g., general, development, random"
						class="w-full"
						autofocus
					/>
					{#if mode === 'create'}
						<p class="text-xs text-slate-500 mt-1">
							ID will be: {roomName ? roomName.toLowerCase().replace(/\s+/g, '-') : '...'}
						</p>
					{/if}
				</div>
			</div>

			<div class="flex gap-2 justify-end mt-6">
				<Button variant="outline" onclick={handleClose}>Cancel</Button>
				<Button onclick={handleSave} disabled={!roomName.trim()}>
					{mode === 'create' ? 'Create' : 'Save'}
				</Button>
			</div>
		</div>
	</div>
{/if}
