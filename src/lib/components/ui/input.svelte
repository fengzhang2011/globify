<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		type = 'text',
		value = $bindable(''),
		...restProps
	}: {
		class?: string;
		type?: string;
		value?: string | number;
	} & svelte.JSX.HTMLAttributes<HTMLInputElement> = $props();
</script>

<input
	{type}
	bind:value
	class={cn(
		'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
/>
