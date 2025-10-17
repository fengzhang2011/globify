<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		open?: boolean;
		title?: string;
		message?: string;
	}

	let {
		open = $bindable(false),
		title = 'Confirm Delete',
		message = 'Are you sure you want to delete this item?'
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		confirm: void;
		cancel: void;
	}>();

	function handleConfirm() {
		dispatch('confirm');
		open = false;
	}

	function handleCancel() {
		dispatch('cancel');
		open = false;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50" onclick={handleCancel}></div>

		<!-- Dialog -->
		<div class="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
			<h2 class="text-xl font-semibold text-slate-900 mb-4">{title}</h2>

			<p class="text-slate-600 mb-6">{message}</p>

			<div class="flex gap-2 justify-end">
				<Button variant="outline" onclick={handleCancel}>Cancel</Button>
				<Button variant="destructive" onclick={handleConfirm}>Delete</Button>
			</div>
		</div>
	</div>
{/if}
