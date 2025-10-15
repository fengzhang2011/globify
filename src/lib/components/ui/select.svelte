<script lang="ts">
	import { type Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		value = $bindable(),
		children,
		...restProps
	}: {
		class?: string;
		value?: any;
		children: Snippet;
	} & svelte.JSX.HTMLAttributes<HTMLSelectElement> = $props();
</script>

<select
	bind:value
	class={cn(
		'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children()}
</select>
