<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import CodeIcon from '@lucide/svelte/icons/code';
  import Edit3Icon from '@lucide/svelte/icons/pencil';
  import { useQuery } from 'convex-svelte';

  import { page } from '$app/stores';
  import { api } from '$convex/_generated/api.js';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const problemId = $derived($page.params.problemId as any);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const problemQuery = useQuery(api.problems.get, () => (problemId ? { id: problemId } : 'skip'));
  const ioQuery = useQuery(api.problems.listIO, () => (problemId ? { problemId } : 'skip'));

  // --- Reactive Derived States ---
  const problem = $derived(problemQuery.data);
  const ios = $derived(ioQuery.data || []);
  const isLoading = $derived(problemQuery.isLoading || ioQuery.isLoading);
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 md:p-8">
  <!-- Back navigation -->
  <div class="flex items-center justify-between">
    <Button
      href="/problems"
      variant="ghost"
      class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
    >
      <ArrowLeftIcon class="h-3.5 w-3.5" />
      Back to Question Bank
    </Button>

    {#if (userRole === 'admin' || userRole === 'teacher') && problem}
      <Button
        href="/problems/{problemId}/edit"
        variant="outline"
        class="h-8 gap-1.5 border-border text-xs font-semibold"
      >
        <Edit3Icon class="h-3.5 w-3.5" />
        Edit Problem
      </Button>
    {/if}
  </div>

  {#if isLoading}
    <div class="flex flex-col gap-6">
      <Skeleton class="h-12 w-1/3" />
      <Skeleton class="h-64 w-full" />
    </div>
  {:else if !problem}
    <Card.Root class="border-border p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-foreground">Problem Not Found</Card.Title>
        <Card.Description>The requested coding challenge does not exist in the database.</Card.Description>
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/problems" variant="outline" class="border-border text-xs font-semibold">
          Return to Question Bank
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Content split -->
    <div class="grid gap-6 md:grid-cols-3">
      <!-- Main: Markdown Details -->
      <div class="flex flex-col gap-6 md:col-span-2">
        <Card.Root class="border border-border bg-card">
          <Card.Header class="border-b border-border/40 pb-3">
            <div class="flex items-center gap-2">
              <CodeIcon class="h-5 w-5 text-primary" />
              <Card.Title class="text-2xl font-bold tracking-tight text-foreground">{problem.title}</Card.Title>
            </div>
          </Card.Header>
          <Card.Content
            class="prose max-w-none pt-6 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 dark:prose-invert"
          >
            {problem.contentMd}
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Right: Test Cases -->
      <div class="flex flex-col gap-6">
        <Card.Root class="border border-border bg-card">
          <Card.Header class="border-b border-border/40 pb-3">
            <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
              >Sample Test Cases</Card.Title
            >
          </Card.Header>
          <Card.Content class="flex flex-col gap-4 pt-4">
            {#if ios.length === 0}
              <div class="text-xs text-muted-foreground/80 italic">No sample input/output test cases configured.</div>
            {:else}
              {#each ios as io, index (io._id)}
                <div class="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3">
                  <span class="text-[10px] font-bold text-primary uppercase">Case #{index + 1}</span>
                  <div class="grid gap-2">
                    <div>
                      <span class="text-[9px] font-bold text-muted-foreground uppercase">Input:</span>
                      <pre
                        class="mt-1 rounded-sm border border-border/40 bg-card p-1.5 font-mono text-xs">{io.inputData ||
                          '∅'}</pre>
                    </div>
                    <div>
                      <span class="text-[9px] font-bold text-muted-foreground uppercase">Expected Output:</span>
                      <pre
                        class="mt-1 rounded-sm border border-border/40 bg-card p-1.5 font-mono text-xs">{io.outputData}</pre>
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  {/if}
</div>
