<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { useConvexClient } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';
  import { api } from '$convex/_generated/api.js';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();
  const userId = $derived($session?.userId);
  const userRole = $derived($session?.role);

  let title = $state('');
  let contentMd = $state('');
  let isSubmitting = $state(false);

  async function handleCreateProblem() {
    if (!title.trim()) {
      toast.error('Problem title is required');
      return;
    }
    if (!contentMd.trim()) {
      toast.error('Problem description is required');
      return;
    }
    if (!userId) {
      toast.error('You must be logged in to create a problem');
      return;
    }
    isSubmitting = true;
    try {
      await client.mutation(api.problems.create, {
        createdBy: userId as any,
        title: title.trim(),
        contentMd: contentMd.trim(),
      });
      toast.success('Coding problem added successfully!');
      goto('/problems');
    } catch (e) {
      console.error(e);
      toast.error('Failed to create coding problem');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 md:p-8">
  <!-- Header / Navigation -->
  <div>
    <Button
      href="/problems"
      variant="ghost"
      class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
    >
      <ArrowLeftIcon class="h-3.5 w-3.5" />
      Back to Question Bank
    </Button>
  </div>

  {#if userRole !== 'admin' && userRole !== 'teacher'}
    <!-- Unauthorized Access Protection -->
    <Card.Root class="border-destructive bg-destructive/5 p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-destructive">Unauthorized Access</Card.Title>
        <Card.Description
          >Only teachers and administrators are authorized to add algorithmic challenges.</Card.Description
        >
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/problems" variant="outline" class="border-border text-xs font-semibold">
          Return to Question Bank
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Form -->
    <Card.Root class="border border-border bg-card shadow-sm">
      <Card.Header class="border-b border-border/40 pb-5">
        <Card.Title class="text-2xl font-bold tracking-tight text-foreground">Create Algorithmic Problem</Card.Title>
        <Card.Description class="mt-1 text-sm text-muted-foreground">
          Define a coding challenge, specify instructions, details, and sample inputs.
        </Card.Description>
      </Card.Header>

      <Card.Content class="grid gap-6 pt-6">
        <div class="grid gap-2">
          <Label for="prob-title" class="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Problem Title <span class="text-destructive">*</span>
          </Label>
          <Input
            id="prob-title"
            placeholder="e.g. Find First and Last Position of Element in Sorted Array"
            class="h-10 border-border bg-card"
            bind:value={title}
            disabled={isSubmitting}
          />
        </div>

        <div class="grid gap-2">
          <Label for="prob-desc" class="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Challenge Description (Markdown supported) <span class="text-destructive">*</span>
          </Label>
          <Textarea
            id="prob-desc"
            placeholder="Outline the programming task, input and output formats, and constraint parameters..."
            rows={10}
            class="resize-y border-border bg-card"
            bind:value={contentMd}
            disabled={isSubmitting}
          />
        </div>
      </Card.Content>

      <Card.Footer class="flex items-center justify-end gap-3 border-t border-border/40 px-6 py-4">
        <Button
          href="/problems"
          variant="outline"
          class="h-9 border-border text-xs font-semibold"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button onclick={handleCreateProblem} class="h-9 text-xs font-bold shadow-xs" disabled={isSubmitting}>
          {#if isSubmitting}
            <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            Creating...
          {:else}
            <PlusIcon class="mr-1.5 h-3.5 w-3.5" />
            Create Challenge
          {/if}
        </Button>
      </Card.Footer>
    </Card.Root>
  {/if}
</div>
