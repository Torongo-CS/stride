<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import CctvIcon from '@lucide/svelte/icons/cctv';
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
  import CodeIcon from '@lucide/svelte/icons/code';
  import Edit3Icon from '@lucide/svelte/icons/pencil';
  import PlayCircleIcon from '@lucide/svelte/icons/play-circle';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { page } from '$app/stores';
  import { api } from '$convex/_generated/api.js';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();
  const activityId = $derived($page.params.activityId as any);
  const userId = $derived($session?.userId);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const activityQuery = useQuery(api.activities.get, () => (activityId ? { id: activityId } : 'skip'));
  const problemsQuery = useQuery(api.activities.listProblems, () => (activityId ? { activityId } : 'skip'));

  // --- Derived states ---
  const activity = $derived(activityQuery.data);
  const problems = $derived((problemsQuery.data ?? []).filter(Boolean));
  const isLoading = $derived(activityQuery.isLoading || problemsQuery.isLoading);

  // --- Form State for Teachers to Create & Assign Problems ---
  let problemTitle = $state('');
  let problemContentMd = $state('');
  let isCreatingProblem = $state(false);

  async function handleCreateAndAssignProblem() {
    if (!problemTitle.trim()) {
      toast.error('Problem title is required');
      return;
    }
    if (!problemContentMd.trim()) {
      toast.error('Problem description is required');
      return;
    }
    if (!userId) return;

    isCreatingProblem = true;
    try {
      // 1. Insert into problem schema
      const newProblemId = await client.mutation(api.problems.create, {
        createdBy: userId as any,
        title: problemTitle.trim(),
        contentMd: problemContentMd.trim(),
      });

      // 2. Attach to activity problems schema
      await client.mutation(api.activities.addProblem, {
        activityId,
        problemId: newProblemId,
        problemOrder: problems.length + 1,
      });

      toast.success('Problem created and assigned successfully!');
      problemTitle = '';
      problemContentMd = '';
    } catch (e) {
      console.error(e);
      toast.error('Failed to create and assign problem');
    } finally {
      isCreatingProblem = false;
    }
  }

  // --- Edit Problem Dialog State ---
  let editDialogOpen = $state(false);
  let editProblemId = $state<string | null>(null);
  let editProblemTitle = $state('');
  let editProblemContentMd = $state('');
  let isUpdatingProblem = $state(false);

  function openEditProblem(id: string, title: string, contentMd: string) {
    editProblemId = id;
    editProblemTitle = title;
    editProblemContentMd = contentMd;
    editDialogOpen = true;
  }

  async function handleUpdateProblem() {
    if (!editProblemId || !editProblemTitle.trim()) {
      toast.error('Problem title is required');
      return;
    }
    if (!editProblemContentMd.trim()) {
      toast.error('Problem description is required');
      return;
    }

    isUpdatingProblem = true;
    try {
      await client.mutation(api.problems.update, {
        id: editProblemId as any,
        title: editProblemTitle.trim(),
        contentMd: editProblemContentMd.trim(),
      });
      toast.success('Problem updated successfully!');
      editDialogOpen = false;
    } catch (e) {
      console.error(e);
      toast.error('Failed to update problem');
    } finally {
      isUpdatingProblem = false;
    }
  }

  async function handleRemoveProblem(problemId: string) {
    if (!confirm('Are you sure you want to remove this problem from the activity?')) return;
    try {
      await client.mutation(api.activities.removeProblem, {
        activityId,
        problemId: problemId as any,
      });
      toast.success('Problem removed from activity');
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove problem');
    }
  }
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:p-8">
  <!-- Back Navigation -->
  {#if activity}
    <div>
      <Button
        href="/sections/{activity.sectionId}"
        variant="ghost"
        class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
      >
        <ArrowLeftIcon class="h-3.5 w-3.5" />
        Back to Section Hub
      </Button>
    </div>
  {/if}

  {#if isLoading}
    <div class="flex flex-col gap-6">
      <Skeleton class="h-12 w-1/3" />
      <Skeleton class="h-64 w-full" />
    </div>
  {:else if !activity}
    <Card.Root class="border-border bg-card p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-foreground">Activity Not Found</Card.Title>
        <Card.Description>The requested class activity room could not be resolved.</Card.Description>
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/dashboard" variant="outline" class="border-border text-xs font-semibold">
          Return to Dashboard
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Master Header -->
    <div class="flex flex-col gap-1 border-b border-border/40 pb-5">
      <div class="flex items-center gap-2.5">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">{activity.title}</h1>
        <Badge
          variant="outline"
          class="border-primary/20 bg-primary/5 px-1.5 py-0 text-[10px] font-bold tracking-wider text-primary uppercase"
        >
          {activity.type}
        </Badge>
      </div>
      <p class="text-xs text-muted-foreground">Welcome to the Live Lecture & Activity room workspace.</p>
    </div>

    <div class="grid gap-6 md:grid-cols-5">
      <!-- Left side (3 columns): Problems list and creation form -->
      <div class="flex flex-col gap-6 md:col-span-3">
        <!-- Problems Registry -->
        <Card.Root class="border border-border bg-card">
          <Card.Header>
            <Card.Title class="text-lg font-bold text-foreground"
              >Assigned Coding Problems ({problems.length})</Card.Title
            >
            <Card.Description>Complete the following programming exercises to submit your code.</Card.Description>
          </Card.Header>
          <Card.Content class="flex flex-col gap-3">
            {#if problems.length === 0}
              <div
                class="rounded-lg border border-dashed border-border p-12 text-center text-xs text-muted-foreground italic"
              >
                No coding challenges have been assigned to this activity yet.
              </div>
            {:else}
              <div class="flex flex-col gap-3">
                {#each problems as p (p._id)}
                  {#if p.problem}
                    <div
                      class="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20"
                    >
                      <div class="flex items-center gap-3">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <CodeIcon class="h-4 w-4" />
                        </div>
                        <div class="flex flex-col">
                          <span class="text-sm font-semibold text-foreground">{p.problem.title}</span>
                          <span class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.problem.contentMd}</span>
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-2">
                        {#if userRole === 'teacher' || userRole === 'admin'}
                          <Button
                            size="icon"
                            variant="ghost"
                            class="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
                            onclick={() => openEditProblem(p.problem!._id, p.problem!.title, p.problem!.contentMd)}
                            title="Edit Problem"
                          >
                            <Edit3Icon class="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            class="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onclick={() => handleRemoveProblem(p.problem!._id)}
                            title="Remove from Activity"
                          >
                            <Trash2Icon class="h-4 w-4" />
                          </Button>
                        {/if}

                        <Button
                          size="sm"
                          href="/activities/{activityId}/{p.problem._id}"
                          class="px-4 text-xs font-bold shadow-xs"
                        >
                          Enter Lab Room
                        </Button>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Teacher Create Problem Form -->
        {#if userRole === 'teacher' || userRole === 'admin'}
          <Card.Root class="border border-border bg-card">
            <Card.Header class="border-b border-border/40 pb-4">
              <Card.Title class="text-lg font-bold text-foreground">Create & Assign New Problem</Card.Title>
              <Card.Description
                >Define a custom challenge that will instantly sync with the global problems schema and be assigned to
                this activity.</Card.Description
              >
            </Card.Header>
            <Card.Content class="grid gap-4 pt-5">
              <div class="grid gap-2">
                <Label for="new-title" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                  >Problem Title</Label
                >
                <Input
                  id="new-title"
                  placeholder="e.g. Reverse Linked List"
                  class="h-10 border-border bg-card"
                  bind:value={problemTitle}
                  disabled={isCreatingProblem}
                />
              </div>
              <div class="grid gap-2">
                <Label for="new-desc" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                  >Markdown Instructions</Label
                >
                <Textarea
                  id="new-desc"
                  placeholder="Write full specifications, examples, constraints..."
                  rows={6}
                  class="resize-y border-border bg-card"
                  bind:value={problemContentMd}
                  disabled={isCreatingProblem}
                />
              </div>
            </Card.Content>
            <Card.Footer class="flex justify-end border-t border-border/40 py-3.5">
              <Button
                onclick={handleCreateAndAssignProblem}
                disabled={isCreatingProblem || !problemTitle.trim() || !problemContentMd.trim()}
                class="h-9 text-xs font-bold shadow-xs"
              >
                {#if isCreatingProblem}
                  <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  ></span>
                  Creating...
                {:else}
                  <PlusIcon class="mr-1.5 h-3.5 w-3.5" />
                  Create & Assign
                {/if}
              </Button>
            </Card.Footer>
          </Card.Root>
        {/if}
      </div>

      <!-- Right side (2 columns): Teacher Room links -->
      <div class="flex flex-col gap-6 md:col-span-2">
        <Card.Root class="border border-border bg-card">
          <Card.Header class="border-b border-border/40 pb-3">
            <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
              >Activity Control Center</Card.Title
            >
          </Card.Header>
          <Card.Content class="flex flex-col gap-2.5 pt-4">
            {#if userRole === 'teacher' || userRole === 'admin'}
              <Button
                href="/activities/{activityId}/cctv"
                variant="outline"
                class="w-full justify-start gap-2 border-border py-5 text-xs font-semibold"
              >
                <CctvIcon class="h-4 w-4 shrink-0 text-primary" />
                <span>View CCTV Screenshare Grid</span>
              </Button>

              <Button
                href="/activities/{activityId}/results"
                variant="outline"
                class="w-full justify-start gap-2 border-border py-5 text-xs font-semibold"
              >
                <ClipboardListIcon class="h-4 w-4 shrink-0 text-primary" />
                <span>View Scoreboard & Submissions</span>
              </Button>

              <Button
                href="/activities/{activityId}/playback"
                variant="outline"
                class="w-full justify-start gap-2 border-border py-5 text-xs font-semibold"
              >
                <PlayCircleIcon class="h-4 w-4 shrink-0 text-primary" />
                <span>Review Student Code Playbacks</span>
              </Button>

              <Button
                href="/activities/{activityId}/edit"
                variant="outline"
                class="w-full justify-start gap-2 border-border py-5 text-xs font-semibold"
              >
                <Edit3Icon class="h-4 w-4 shrink-0 text-primary" />
                <span>Update Activity Settings & Reorder</span>
              </Button>
            {:else}
              <div class="text-xs leading-relaxed text-muted-foreground">
                Welcome to the student activity workspace. Click on the <strong>Enter Lab Room</strong> buttons to start coding
                and submitting your answers for review.
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  {/if}
</div>

<!-- ================= Edit Problem Dialog ================= -->
<Dialog.Root bind:open={editDialogOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Edit Programming Problem</Dialog.Title>
      <Dialog.Description>Update the challenge title and instruction markdown body.</Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-4 py-4">
      <!-- Title -->
      <div class="grid gap-1.5">
        <Label for="edit-title" class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >Problem Title</Label
        >
        <Input
          id="edit-title"
          class="h-10 border-border bg-card"
          bind:value={editProblemTitle}
          disabled={isUpdatingProblem}
        />
      </div>

      <!-- Description -->
      <div class="grid gap-1.5">
        <Label for="edit-desc" class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >Markdown Instructions</Label
        >
        <Textarea
          id="edit-desc"
          rows={8}
          class="resize-y border-border bg-card"
          bind:value={editProblemContentMd}
          disabled={isUpdatingProblem}
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (editDialogOpen = false)} disabled={isUpdatingProblem}>Cancel</Button>
      <Button
        onclick={handleUpdateProblem}
        disabled={isUpdatingProblem || !editProblemTitle.trim() || !editProblemContentMd.trim()}
      >
        {#if isUpdatingProblem}
          <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Saving...
        {:else}
          Save Changes
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
