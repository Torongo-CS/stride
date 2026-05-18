<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import CodeIcon from '@lucide/svelte/icons/code';
  import Edit3Icon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { api } from '$convex/_generated/api.js';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const problemsQuery = useQuery(api.problems.list, {});

  // --- Reactive Derived States ---
  const problems = $derived(problemsQuery.data || []);
  let searchQuery = $state('');

  const filteredProblems = $derived(
    problems.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contentMd.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  const isLoading = $derived(problemsQuery.isLoading);

  async function handleDeleteProblem(id: string) {
    if (!confirm('Are you sure you want to delete this coding problem?')) return;
    try {
      await client.mutation(api.problems.remove, { id: id as any });
      toast.success('Problem deleted successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete problem');
    }
  }
</script>

<div class="flex flex-col gap-6 p-6 md:p-8">
  <!-- Header Bar -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">Question Bank</h1>
      <p class="text-sm text-muted-foreground">
        Manage, edit, and create algorithmic coding challenges for your classes.
      </p>
    </div>
    {#if userRole === 'admin' || userRole === 'teacher'}
      <Button href="/problems/new" class="text-xs font-bold shadow-xs">
        <PlusIcon class="mr-1.5 h-4 w-4" />
        Create Problem
      </Button>
    {/if}
  </div>

  <!-- Search filters -->
  <div class="flex items-center gap-4">
    <div class="relative w-full max-w-sm">
      <SearchIcon class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search problems by name or syllabus..."
        class="border-border bg-card pl-8 shadow-xs"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Problems Grid -->
  {#if isLoading}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <Card.Root class="border border-border bg-card">
          <Card.Header class="gap-2">
            <Skeleton class="h-6 w-3/4" />
            <Skeleton class="h-4 w-full" />
          </Card.Header>
          <Card.Content class="gap-4">
            <Skeleton class="h-12 w-full" />
          </Card.Content>
          <Card.Footer class="gap-2">
            <Skeleton class="h-8 w-full" />
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {:else if filteredProblems.length === 0}
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-16 text-center"
    >
      <CodeIcon class="mb-3 h-10 w-10 text-muted-foreground/60" />
      <h3 class="text-lg font-bold text-foreground">No coding problems found</h3>
      <p class="mt-1 text-sm text-muted-foreground">Try modifying your query or add a new challenge above.</p>
    </div>
  {:else}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredProblems as p (p._id)}
        <Card.Root
          class="flex h-full flex-col justify-between border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <Card.Header class="pb-3">
            <div class="flex items-start justify-between gap-4">
              <Card.Title class="line-clamp-1 text-xl font-bold tracking-tight text-foreground">
                {p.title}
              </Card.Title>
            </div>
            <Card.Description class="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground/90">
              {p.contentMd}
            </Card.Description>
          </Card.Header>

          <Card.Content class="flex flex-1 flex-col justify-end gap-4 py-2">
            <div class="flex items-center justify-between border-t border-border/30 pt-3">
              <span class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Problem Type</span>
              <Badge variant="secondary" class="border-border bg-muted/40 px-2 py-0.5 text-[10px] font-bold">
                Algorithmic Code
              </Badge>
            </div>
          </Card.Content>

          <Card.Footer class="flex items-center gap-2 border-t border-border/30 pt-4 pb-4">
            <Button
              size="sm"
              variant="outline"
              href="/problems/{p._id}"
              class="flex-1 justify-center border-border text-xs font-semibold hover:bg-muted/50"
            >
              <BookOpenIcon class="mr-1.5 h-3.5 w-3.5" />
              View Details
            </Button>
            {#if userRole === 'admin' || userRole === 'teacher'}
              <Button
                size="sm"
                variant="outline"
                href="/problems/{p._id}/edit"
                class="border-border px-2.5 text-xs font-semibold hover:bg-muted/50"
                title="Edit Details"
              >
                <Edit3Icon class="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onclick={() => handleDeleteProblem(p._id)}
                class="border-border px-2.5 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
                title="Delete Problem"
              >
                <Trash2Icon class="h-3.5 w-3.5" />
              </Button>
            {/if}
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
