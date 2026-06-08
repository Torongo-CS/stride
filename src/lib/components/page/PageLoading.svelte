<script lang="ts">
  import Loader2 from '@lucide/svelte/icons/loader-2';

  let { text = 'Loading...' }: { text?: string } = $props();
</script>

<div class="flex h-64 flex-col items-center justify-center gap-2">
  <Loader2 class="h-8 w-8 animate-spin text-primary" />
  <span class="text-xs font-semibold text-muted-foreground">{text}</span>
</div>
