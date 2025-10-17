<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { Contact } from '$lib/services/db';

	interface Props {
		open?: boolean;
		contact?: Contact | null;
		mode?: 'create' | 'edit';
	}

	let { open = $bindable(false), contact = null, mode = 'create' }: Props = $props();

	const dispatch = createEventDispatcher<{
		save: { id: string; username: string; status: 'online' | 'offline' | 'away' };
		cancel: void;
	}>();

	let username = $state(contact?.username || '');
	let contactId = $state(contact?.id || '');
	let status = $state<'online' | 'offline' | 'away'>(contact?.status || 'offline');

	$effect(() => {
		if (contact) {
			username = contact.username;
			contactId = contact.id;
			status = contact.status;
		} else {
			username = '';
			contactId = '';
			status = 'offline';
		}
	});

	function handleSave() {
		if (!username.trim()) return;

		const id = mode === 'create' ? `user-${username.toLowerCase().replace(/\s+/g, '-')}` : contactId;

		dispatch('save', {
			id,
			username: username.trim(),
			status
		});
		handleClose();
	}

	function handleClose() {
		open = false;
		username = '';
		contactId = '';
		status = 'offline';
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
				{mode === 'create' ? 'Add New Contact' : 'Edit Contact'}
			</h2>

			<div class="space-y-4">
				<div>
					<label for="username" class="block text-sm font-medium text-slate-700 mb-1">
						Username
					</label>
					<Input
						id="username"
						bind:value={username}
						onkeydown={handleKeyPress}
						placeholder="e.g., Alice, Bob, Charlie"
						class="w-full"
						autofocus
					/>
					{#if mode === 'create'}
						<p class="text-xs text-slate-500 mt-1">
							ID will be: {username ? `user-${username.toLowerCase().replace(/\s+/g, '-')}` : '...'}
						</p>
					{/if}
				</div>

				<div>
					<label for="status" class="block text-sm font-medium text-slate-700 mb-1">
						Status
					</label>
					<select
						id="status"
						bind:value={status}
						class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="online">🟢 Online</option>
						<option value="away">🟡 Away</option>
						<option value="offline">⚫ Offline</option>
					</select>
				</div>
			</div>

			<div class="flex gap-2 justify-end mt-6">
				<Button variant="outline" onclick={handleClose}>Cancel</Button>
				<Button onclick={handleSave} disabled={!username.trim()}>
					{mode === 'create' ? 'Add' : 'Save'}
				</Button>
			</div>
		</div>
	</div>
{/if}
