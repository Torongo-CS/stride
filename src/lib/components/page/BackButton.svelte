<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';

  import { Button } from '$lib/components/ui/button/index.js';

  let { href, label }: { href: string; label: string } = $props();
</script>

<div class="flex items-center">
  <Button variant="ghost" size="sm" {href} class="h-8 gap-1.5 pl-2 text-muted-foreground hover:text-foreground">
    <ArrowLeft class="h-4 w-4" />
    {label}
  </Button>
</div>
