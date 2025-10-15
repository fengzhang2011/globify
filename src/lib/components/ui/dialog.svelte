<script lang="ts">
	import { type Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		open = $bindable(false),
		children
	}: {
		open?: boolean;
		children: Snippet;
	} = $props();

	function handleOverlayClick() {
		open = false;
	}

	function handleContentClick(e: MouseEvent) {
		e.stopPropagation();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 bg-black/80"
		onclick={handleOverlayClick}
		onkeydown={handleKeydown}
		role="button"
		tabindex="-1"
	>
		<div class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
			<div
				class={cn(
					'grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg rounded-lg',
					'sm:rounded-lg'
				)}
				onclick={handleContentClick}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				tabindex="-1"
			>
				{@render children()}
			</div>
		</div>
	</div>
{/if}
