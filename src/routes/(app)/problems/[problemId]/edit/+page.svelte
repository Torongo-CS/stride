<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SaveIcon from '@lucide/svelte/icons/save';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { page } from '$app/stores';
  import { api } from '$convex/_generated/api.js';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();
  const problemId = $derived($page.params.problemId as any);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const problemQuery = useQuery(api.problems.get, () => (problemId ? { id: problemId } : 'skip'));
  const ioQuery = useQuery(api.problems.listIO, () => (problemId ? { problemId } : 'skip'));

  // --- Reactive Derived States ---
  const problem = $derived(problemQuery.data);
  const ios = $derived(ioQuery.data || []);
  const isLoading = $derived(problemQuery.isLoading || ioQuery.isLoading);

  let title = $state('');
  let contentMd = $state('');
  let isSubmitting = $state(false);

  // Form state for creating a new test case
  let newIOInput = $state('');
  let newIOOutput = $state('');

  $effect(() => {
    if (problem) {
      title = problem.title;
      contentMd = problem.contentMd;
    }
  });

  // --- Operations ---
  async function handleUpdateProblem() {
    if (!title.trim()) {
      toast.error('Problem title is required');
      return;
    }
    if (!contentMd.trim()) {
      toast.error('Problem description is required');
      return;
    }
    isSubmitting = true;
    try {
      await client.mutation(api.problems.update, {
        id: problemId,
        title: title.trim(),
        contentMd: contentMd.trim(),
      });
      toast.success('Coding problem updated successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update coding problem');
    } finally {
      isSubmitting = false;
    }
  }

  async function handleAddIO() {
    if (!newIOOutput.trim()) {
      toast.error('Test case expected output is required');
      return;
    }
    try {
      await client.mutation(api.problems.addIO, {
        problemId,
        inputData: newIOInput.trim(),
        outputData: newIOOutput.trim(),
        ioOrder: ios.length + 1,
      });
      toast.success('Test case added successfully!');
      newIOInput = '';
      newIOOutput = '';
    } catch (e) {
      console.error(e);
      toast.error('Failed to add test case');
    }
  }

  async function handleRemoveIO(ioId: string) {
    try {
      await client.mutation(api.problems.removeIO, { id: ioId as any });
      toast.success('Test case deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove test case');
    }
  }
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:p-8">
  <!-- Back navigation -->
  <div class="flex items-center justify-between">
    <Button
      href="/problems/{problemId}"
      variant="ghost"
      class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
    >
      <ArrowLeftIcon class="h-3.5 w-3.5" />
      Back to Details
    </Button>
  </div>

  {#if userRole !== 'admin' && userRole !== 'teacher'}
    <!-- Unauthorized Access Protection -->
    <Card.Root class="border-destructive bg-destructive/5 p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-destructive">Unauthorized Access</Card.Title>
        <Card.Description>Only teachers and administrators are authorized to edit coding problems.</Card.Description>
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/problems" variant="outline" class="border-border text-xs font-semibold">
          Return to Question Bank
        </Button>
      </Card.Content>
    </Card.Root>
  {:else if isLoading}
    <div class="flex flex-col gap-6">
      <Skeleton class="h-12 w-1/3" />
      <Skeleton class="h-64 w-full" />
    </div>
  {:else if !problem}
    <Card.Root class="border-border p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-foreground">Problem Not Found</Card.Title>
        <Card.Description>The coding challenge you are trying to edit does not exist.</Card.Description>
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/problems" variant="outline" class="border-border text-xs font-semibold">
          Return to Question Bank
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Master Header -->
    <div class="flex flex-col gap-1 border-b border-border/40 pb-4">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">Edit Problem: {problem.title}</h1>
      <p class="text-xs text-muted-foreground">Modify challenge title, contents, and update sample IO test cases.</p>
    </div>

    <!-- Layout Grid -->
    <div class="grid gap-6 md:grid-cols-5">
      <!-- Left (3 columns): Problem Info Form -->
      <div class="md:col-span-3">
        <Card.Root class="border border-border bg-card">
          <Card.Header>
            <Card.Title class="text-lg font-bold text-foreground">Problem Description</Card.Title>
            <Card.Description>Update the challenge details, formatting guidelines, and parameters.</Card.Description>
          </Card.Header>
          <Card.Content class="grid gap-4">
            <div class="grid gap-2">
              <Label for="prob-title" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Challenge Title</Label
              >
              <Input id="prob-title" class="h-10 border-border bg-card" bind:value={title} disabled={isSubmitting} />
            </div>
            <div class="grid gap-2">
              <Label for="prob-desc" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Syllabus & Constraints</Label
              >
              <Textarea
                id="prob-desc"
                rows={12}
                class="resize-y border-border bg-card font-sans leading-relaxed"
                bind:value={contentMd}
                disabled={isSubmitting}
              />
            </div>
          </Card.Content>
          <Card.Footer class="flex items-center justify-end border-t border-border/40 py-3">
            <Button onclick={handleUpdateProblem} disabled={isSubmitting} class="h-9 text-xs font-bold shadow-xs">
              {#if isSubmitting}
                <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></span>
                Saving...
              {:else}
                <SaveIcon class="mr-1.5 h-3.5 w-3.5" />
                Save Changes
              {/if}
            </Button>
          </Card.Footer>
        </Card.Root>
      </div>

      <!-- Right (2 columns): Test Cases Creator & Registry -->
      <div class="flex flex-col gap-6 md:col-span-2">
        <!-- Add Test Case Card -->
        <Card.Root class="border border-border bg-card">
          <Card.Header>
            <Card.Title class="text-lg font-bold text-foreground">Add Test Case</Card.Title>
            <Card.Description>Define a new I/O example to validate students' submissions.</Card.Description>
          </Card.Header>
          <Card.Content class="grid gap-4">
            <div class="grid gap-1.5">
              <Label for="io-input" class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                >Input Data (Optional)</Label
              >
              <Textarea
                id="io-input"
                placeholder="e.g. [2,7,11,15]"
                rows={2}
                class="border-border bg-card font-mono text-xs"
                bind:value={newIOInput}
              />
            </div>
            <div class="grid gap-1.5">
              <Label for="io-output" class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                >Expected Output Data <span class="text-destructive">*</span></Label
              >
              <Textarea
                id="io-output"
                placeholder="e.g. [0,1]"
                rows={2}
                class="border-border bg-card font-mono text-xs"
                bind:value={newIOOutput}
              />
            </div>
          </Card.Content>
          <Card.Footer class="flex items-center justify-end border-t border-border/40 py-3">
            <Button onclick={handleAddIO} disabled={!newIOOutput.trim()} class="h-9 text-xs font-bold shadow-xs">
              <PlusIcon class="mr-1.5 h-3.5 w-3.5" />
              Add Test Case
            </Button>
          </Card.Footer>
        </Card.Root>

        <!-- Current Test Cases Card -->
        <Card.Root class="border border-border bg-card">
          <Card.Header>
            <Card.Title class="text-lg font-bold text-foreground">Configured Test Cases ({ios.length})</Card.Title>
            <Card.Description>Validate inputs against expected values.</Card.Description>
          </Card.Header>
          <Card.Content>
            {#if ios.length === 0}
              <div
                class="rounded-lg border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground italic"
              >
                No sample test cases configured for this problem yet.
              </div>
            {:else}
              <div class="flex flex-col gap-4">
                {#each ios as io, idx (io._id)}
                  <div class="group relative flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3.5">
                    <span class="text-[10px] font-bold text-primary uppercase">Test Case #{idx + 1}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      class="absolute top-2 right-2 h-7 w-7 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onclick={() => handleRemoveIO(io._id)}
                      title="Delete Test Case"
                    >
                      <Trash2Icon class="h-3.5 w-3.5" />
                    </Button>
                    <div class="mt-1 grid gap-1.5">
                      <div>
                        <span class="text-[9px] font-bold text-muted-foreground uppercase">Input:</span>
                        <pre
                          class="mt-0.5 rounded-sm border border-border/40 bg-card p-1.5 font-mono text-xs">{io.inputData ||
                            '∅'}</pre>
                      </div>
                      <div>
                        <span class="text-[9px] font-bold text-muted-foreground uppercase">Expected Output:</span>
                        <pre
                          class="mt-0.5 rounded-sm border border-border/40 bg-card p-1.5 font-mono text-xs">{io.outputData}</pre>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  {/if}
</div>
