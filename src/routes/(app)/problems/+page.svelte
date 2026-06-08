<script lang="ts">
  import Calendar from '@lucide/svelte/icons/calendar';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Eye from '@lucide/svelte/icons/eye';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  import { FilterTabs, PageEmpty, PageHero, PageLayout } from '$lib/components/page/index.js';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();

  // Queries
  const problemsQuery = useQuery(api.problems.list, {});

  // State
  let searchQuery = $state('');
  let activeTab = $state<'all' | 'my'>('all');
  let problemToDeleteId = $state<Id<'problems'> | null>(null);
  let deleteDialogOpen = $state(false);
  let isDeleting = $state(false);

  // Filtered problems list
  const filteredProblems = $derived.by(() => {
    if (!problemsQuery.data) return [];
    let list = [...problemsQuery.data];

    // Filter by role: Teachers can ONLY see their own problems
    if ($session) {
      if ($session.role === 'teacher') {
        list = list.filter((p) => p.createdBy === $session.userId);
      } else if ($session.role === 'admin') {
        // Admin can toggle between all and my
        if (activeTab === 'my') {
          list = list.filter((p) => p.createdBy === $session.userId);
        }
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    // Sort by newest
    return list.sort((a, b) => b.createdAt - a.createdAt);
  });

  function canManage(createdBy: string) {
    if (!$session) return false;
    return $session.userId === createdBy || $session.role === 'admin' || $session.role === 'teacher';
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function startDelete(id: Id<'problems'>) {
    problemToDeleteId = id;
    deleteDialogOpen = true;
  }

  async function confirmDelete() {
    if (!problemToDeleteId) return;
    isDeleting = true;
    try {
      await client.mutation(api.problems.remove, { id: problemToDeleteId });
      toast.success('Problem deleted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete problem.');
    } finally {
      isDeleting = false;
      problemToDeleteId = null;
      deleteDialogOpen = false;
    }
  }
</script>

<PageLayout>
  <!-- Hero Banner with gradient -->
  <PageHero
    title="Problems"
    description="Browse, manage, and edit programming challenges. Filter, search, and manage inputs/outputs for student submissions."
  >
    {#snippet actions()}
      {#if $session && ($session.role === 'teacher' || $session.role === 'admin')}
        <Button onclick={() => goto('/problems/new')} size="lg" class="font-semibold shadow-sm">
          <Plus class="size-4" /> Create Problem
        </Button>
      {/if}
    {/snippet}
  </PageHero>

  <!-- Filters & Search Bar -->
  {#if $session && $session.role === 'admin'}
    <FilterTabs
      tabs={[
        { label: 'All Problems', value: 'all' },
        { label: 'My Problems', value: 'my' },
      ]}
      bind:activeTab
      bind:searchQuery
      placeholder="Search by title..."
    ></FilterTabs>
  {:else}
    <div class="relative w-full max-w-xs sm:w-64">
      <Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        bind:value={searchQuery}
        placeholder="Search by title..."
        class="pl-9 text-xs focus-visible:ring-primary/30"
      />
    </div>
  {/if}

  <!-- Problems Grid -->
  {#if problemsQuery.isLoading}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each [0, 1, 2, 3, 4, 5] as i (i)}
        <Card.Root class="flex flex-col justify-between border bg-card/40 shadow-sm">
          <Card.Header class="p-5 pb-3">
            <Skeleton class="h-5 w-3/4" />
            <div class="mt-2 flex flex-col gap-2">
              <Skeleton class="h-3 w-24" />
              <Skeleton class="h-3 w-20" />
            </div>
          </Card.Header>
          <Card.Footer class="flex items-center justify-between border-t border-border/40 bg-muted/5 p-4">
            <Skeleton class="h-8 w-24" />
            <div class="flex items-center gap-1">
              <Skeleton class="h-8 w-8 rounded-md" />
              <Skeleton class="h-8 w-8 rounded-md" />
            </div>
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {:else if filteredProblems.length === 0}
    <PageEmpty icon={Code2} title="No problems found" description="Try adjusting your filters or search queries." />
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredProblems as problem (problem._id)}
        <Card.Root
          class="group flex flex-col justify-between border bg-card/40 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
        >
          <Card.Header class="p-5 pb-3">
            <Card.Title
              class="line-clamp-1 text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary"
            >
              {problem.title}
            </Card.Title>
            <div class="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground">
              <div class="flex items-center gap-1.5">
                <Calendar class="h-3.5 w-3.5 shrink-0" />
                <span>Created: {formatTime(problem.createdAt)}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Code2 class="h-3.5 w-3.5 shrink-0" />
                <span
                  >Test Cases: <span class="font-semibold text-foreground/80">{problem.testCaseCount ?? 0}</span></span
                >
              </div>
            </div>
          </Card.Header>
          <Card.Footer class="flex items-center justify-between border-t border-border/40 bg-muted/5 p-4">
            <Button
              variant="ghost"
              size="lg"
              class="font-semibold text-muted-foreground hover:text-foreground"
              onclick={() => goto(`/problems/${problem._id}`)}
            >
              <Eye class="size-3.5" /> View Details
            </Button>
            {#if canManage(problem.createdBy)}
              <div class="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  class="text-muted-foreground hover:text-primary"
                  onclick={() => goto(`/problems/${problem._id}/edit`)}
                >
                  <Pencil class="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  class="text-muted-foreground hover:text-destructive"
                  onclick={() => startDelete(problem._id)}
                >
                  <Trash2 class="size-3.5" />
                </Button>
              </div>
            {/if}
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {/if}
</PageLayout>

<!-- Deletion Confirmation Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Problem</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete this problem? This action cannot be undone and will delete all associated test
        cases.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action variant="destructive" onclick={confirmDelete} disabled={isDeleting}>
        {#if isDeleting}
          <Spinner class="size-3.5" /> Deleting...
        {:else}
          Delete
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
