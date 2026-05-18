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
  const userRole = $derived($session?.role);

  let name = $state('');
  let aboutMd = $state('');
  let isSubmitting = $state(false);

  async function handleCreateSection() {
    if (!name.trim()) {
      toast.error('Section name is required');
      return;
    }
    isSubmitting = true;
    try {
      await client.mutation(api.sections.create, {
        name: name.trim(),
        aboutMd: aboutMd.trim() || undefined,
      });
      toast.success('Section created successfully!');
      goto('/sections');
    } catch (e) {
      console.error(e);
      toast.error('Failed to create section');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 md:p-8">
  <!-- Header / Navigation -->
  <div>
    <Button
      href="/sections"
      variant="ghost"
      class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
    >
      <ArrowLeftIcon class="h-3.5 w-3.5" />
      Back to Sections
    </Button>
  </div>

  {#if userRole !== 'admin'}
    <!-- Unauthorized Access Protection -->
    <Card.Root class="border-destructive bg-destructive/5 p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-destructive">Unauthorized Access</Card.Title>
        <Card.Description>Only administrators are authorized to create new sections.</Card.Description>
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections List
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Section Creation Form -->
    <Card.Root class="border border-border bg-card shadow-sm">
      <Card.Header class="border-b border-border/40 pb-5">
        <Card.Title class="text-2xl font-bold tracking-tight text-foreground">Create New Section</Card.Title>
        <Card.Description class="mt-1 text-sm text-muted-foreground">
          Define a new academic course, assign its syllabus, and initiate class materials.
        </Card.Description>
      </Card.Header>

      <Card.Content class="grid gap-6 pt-6">
        <div class="grid gap-2">
          <Label for="section-name" class="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Section / Course Title <span class="text-destructive">*</span>
          </Label>
          <Input
            id="section-name"
            placeholder="e.g. CSE 1115: Object Oriented Programming"
            class="h-10 border-border bg-card"
            bind:value={name}
            disabled={isSubmitting}
          />
        </div>

        <div class="grid gap-2">
          <Label for="section-desc" class="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Syllabus & Description
          </Label>
          <Textarea
            id="section-desc"
            placeholder="Introduce the class goals, syllabus, prerequisites, or learning outcomes..."
            rows={6}
            class="resize-y border-border bg-card"
            bind:value={aboutMd}
            disabled={isSubmitting}
          />
        </div>
      </Card.Content>

      <Card.Footer class="flex items-center justify-end gap-3 border-t border-border/40 px-6 py-4">
        <Button
          href="/sections"
          variant="outline"
          class="h-9 border-border text-xs font-semibold"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button onclick={handleCreateSection} class="h-9 text-xs font-bold shadow-xs" disabled={isSubmitting}>
          {#if isSubmitting}
            <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            Creating...
          {:else}
            <PlusIcon class="mr-1.5 h-3.5 w-3.5" />
            Create Section
          {/if}
        </Button>
      </Card.Footer>
    </Card.Root>
  {/if}
</div>
