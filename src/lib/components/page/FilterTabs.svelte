<script lang="ts">
  import Search from '@lucide/svelte/icons/search';

  import { Input } from '$lib/components/ui/input/index.js';

  let {
    tabs,
    activeTab = $bindable(),
    searchQuery = $bindable(),
    placeholder = 'Search...',
    actions,
  }: {
    tabs: { label: string; value: string }[];
    activeTab: string;
    searchQuery?: string;
    placeholder?: string;
    actions?: import('svelte').Snippet;
  } = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div class="flex items-center gap-1.5 rounded-lg border bg-muted/20 p-1">
    {#each tabs as tab (tab.value)}
      <button
        onclick={() => (activeTab = tab.value)}
        class="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all {activeTab === tab.value
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'}"
      >
        {tab.label}
      </button>
    {/each}
  </div>
  <div class="flex items-center gap-3">
    {#if searchQuery !== undefined}
      <div class="relative w-full max-w-xs sm:w-64">
        <Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input bind:value={searchQuery} {placeholder} class="pl-9 text-xs focus-visible:ring-primary/30" />
      </div>
    {/if}
    {#if actions}
      {@render actions()}
    {/if}
  </div>
</div>
