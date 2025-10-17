<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ select: string }>();

	let pickerElement: HTMLElement;
	let picker: any;

	onMount(async () => {
		const { Picker } = await import('emoji-picker-element');
		picker = new Picker();
		picker.addEventListener('emoji-click', (event: any) => {
			dispatch('select', event.detail.unicode);
		});
		pickerElement.appendChild(picker);
	});
</script>

<div bind:this={pickerElement} class="emoji-picker-container"></div>

<style>
	.emoji-picker-container :global(emoji-picker) {
		--border-radius: 0.5rem;
		--border-color: #e2e8f0;
		border: 1px solid var(--border-color);
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}
</style>
