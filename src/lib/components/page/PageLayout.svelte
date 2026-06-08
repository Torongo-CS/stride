<script lang="ts">
  let { class: className = '', children }: { class?: string; children: import('svelte').Snippet } = $props();
</script>

<div class="container mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6 {className}">
  {@render children()}
</div>
