<script lang="ts">
	import './layout.css';
	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/favicon.webp" /></svelte:head>
{@render children()}

<img src="/background.webp" alt="Background" class="fixed top-0 left-0 w-full h-full object-cover -z-10" />