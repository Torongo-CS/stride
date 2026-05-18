<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import Edit3Icon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { page } from '$app/stores';
  import { api } from '$convex/_generated/api.js';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();
  const sectionId = $derived($page.params.sectionId as any);
  const userId = $derived($session?.userId);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const sectionQuery = useQuery(api.sections.get, () => (sectionId ? { id: sectionId } : 'skip'));
  const sectionTeachersQuery = useQuery(api.sections.listTeachers, () => (sectionId ? { sectionId } : 'skip'));
  const sectionStudentsQuery = useQuery(api.sections.listStudents, () => (sectionId ? { sectionId } : 'skip'));
  const activitiesQuery = useQuery(api.activities.listBySection, () => (sectionId ? { sectionId } : 'skip'));

  // --- Reactive Derived States ---
  const section = $derived(sectionQuery.data);
  const sectionTeachers = $derived((sectionTeachersQuery.data || []).filter(Boolean) as any[]);
  const sectionStudents = $derived((sectionStudentsQuery.data || []).filter(Boolean) as any[]);
  const activities = $derived(activitiesQuery.data || []);

  const isTeacherOfSection = $derived(sectionTeachers.some((t: any) => t?._id === userId));
  const isStudentOfSection = $derived(sectionStudents.some((s: any) => s?._id === userId));
  const hasAccess = $derived(userRole === 'admin' || isTeacherOfSection || isStudentOfSection);

  const isLoading = $derived(
    sectionQuery.isLoading ||
      sectionTeachersQuery.isLoading ||
      sectionStudentsQuery.isLoading ||
      activitiesQuery.isLoading,
  );

  // --- Teacher Activity Form State ---
  let createActivityOpen = $state(false);
  let isSubmitting = $state(false);
  let newActivity = $state({
    title: '',
    type: 'class' as 'exam' | 'class',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  function openCreateActivity() {
    newActivity = {
      title: '',
      type: 'class',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
    };
    createActivityOpen = true;
  }

  async function handleCreateActivity() {
    if (!newActivity.title.trim()) {
      toast.error('Activity title is required');
      return;
    }
    if (!newActivity.startDate || !newActivity.startTime || !newActivity.endDate || !newActivity.endTime) {
      toast.error('All schedule dates and times are required');
      return;
    }

    const startTimestamp = new Date(`${newActivity.startDate}T${newActivity.startTime}`).getTime();
    const endTimestamp = new Date(`${newActivity.endDate}T${newActivity.endTime}`).getTime();

    if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
      toast.error('Invalid date or time format');
      return;
    }
    if (endTimestamp <= startTimestamp) {
      toast.error('End time must be after the start time');
      return;
    }

    isSubmitting = true;
    try {
      await client.mutation(api.activities.create, {
        sectionId,
        title: newActivity.title.trim(),
        type: newActivity.type,
        startTime: startTimestamp,
        endTime: endTimestamp,
      });
      toast.success('Activity successfully added to section!');
      createActivityOpen = false;
    } catch (e) {
      console.error(e);
      toast.error('Failed to create activity');
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDeleteActivity(activityId: string) {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await client.mutation(api.activities.remove, { id: activityId as any });
      toast.success('Activity deleted successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete activity');
    }
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-8">
  <!-- Back navigation -->
  <div class="flex items-center justify-between">
    <Button
      href="/sections"
      variant="ghost"
      class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
    >
      <ArrowLeftIcon class="h-3.5 w-3.5" />
      Back to Sections
    </Button>

    {#if userRole === 'admin'}
      <Button
        href="/sections/{sectionId}/edit"
        variant="outline"
        class="h-8 gap-1.5 border-border text-xs font-semibold"
      >
        <Edit3Icon class="h-3.5 w-3.5" />
        Section Settings
      </Button>
    {/if}
  </div>

  {#if isLoading}
    <div class="flex flex-col gap-6">
      <Skeleton class="h-12 w-1/3" />
      <div class="grid gap-6 md:grid-cols-3">
        <div class="flex flex-col gap-4 md:col-span-2">
          <Skeleton class="h-40 w-full" />
          <Skeleton class="h-28 w-full" />
        </div>
        <Skeleton class="h-64 w-full" />
      </div>
    </div>
  {:else if !section}
    <Card.Root class="border-border p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-foreground">Section Not Found</Card.Title>
        <Card.Description>The section you are looking for does not exist in the database.</Card.Description>
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections List
        </Button>
      </Card.Content>
    </Card.Root>
  {:else if !hasAccess}
    <Card.Root class="border-destructive bg-destructive/5 p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-destructive">Access Denied</Card.Title>
        <Card.Description>You are not registered or enrolled in this course section.</Card.Description>
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to My Sections
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Title Banner -->
    <div class="flex flex-col gap-1 border-b border-border/40 pb-4">
      <div class="flex items-center gap-2">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">{section.name}</h1>
        <Badge
          variant="secondary"
          class="border-none bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary capitalize"
        >
          {sectionTeachers.length > 0 ? 'Active' : 'Unassigned'}
        </Badge>
      </div>
      <p class="mt-0.5 text-xs text-muted-foreground">Section Workspace Hub & Materials Overview</p>
    </div>

    <!-- Main Workspace Split -->
    <div class="grid gap-6 md:grid-cols-3">
      <!-- Left (Main): Activities Feed -->
      <div class="flex flex-col gap-5 md:col-span-2">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold tracking-wider text-muted-foreground uppercase">Class Activities</h3>
          {#if userRole === 'admin' || isTeacherOfSection}
            <Button onclick={openCreateActivity} size="sm" class="h-8 gap-1.5 text-xs font-bold shadow-xs">
              <PlusIcon class="h-3.5 w-3.5" />
              Add Activity
            </Button>
          {/if}
        </div>

        {#if activities.length === 0}
          <div
            class="rounded-lg border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground italic"
          >
            No active exams, lectures, or coding challenges have been scheduled yet.
          </div>
        {:else}
          <div class="flex flex-col gap-4">
            {#each activities as act (act._id)}
              {@const problemsQuery = useQuery(api.activities.listProblems, { activityId: act._id })}
              {@const problems = (problemsQuery.data ?? []).filter(Boolean)}
              <Card.Root
                class="flex flex-col justify-between border border-border bg-card transition-all hover:shadow-xs"
              >
                <Card.Header class="flex flex-row items-start justify-between gap-4 pb-3">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <Card.Title class="text-base font-bold text-foreground">{act.title}</Card.Title>
                      <Badge
                        variant="outline"
                        class="border-primary/20 bg-primary/5 px-1.5 py-0 text-[10px] font-bold tracking-wider text-primary uppercase"
                      >
                        {act.type}
                      </Badge>
                    </div>
                    <Card.Description class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground/80">
                      <CalendarIcon class="h-3.5 w-3.5 shrink-0" />
                      <span>Start: {formatTime(act.startTime)}</span>
                    </Card.Description>
                    <Card.Description class="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                      <ClockIcon class="h-3.5 w-3.5 shrink-0" />
                      <span>End: {formatTime(act.endTime)}</span>
                    </Card.Description>
                  </div>

                  {#if userRole === 'admin' || isTeacherOfSection}
                    <Button
                      size="icon"
                      variant="ghost"
                      class="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onclick={() => handleDeleteActivity(act._id)}
                      title="Delete Activity"
                    >
                      <Trash2Icon class="h-4 w-4" />
                    </Button>
                  {/if}
                </Card.Header>

                <Card.Content class="pt-0 pb-4">
                  {#if problemsQuery.isLoading}
                    <div class="mt-2 flex gap-2">
                      <Skeleton class="h-6 w-16 rounded-full" />
                      <Skeleton class="h-6 w-20 rounded-full" />
                    </div>
                  {:else if problems.length > 0}
                    <div class="mt-2 flex flex-col gap-1.5 border-t border-border/20 pt-3">
                      <span class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                        >Assigned Coding Problems</span
                      >
                      <div class="mt-1 flex flex-wrap gap-2">
                        {#each problems as p (p._id)}
                          {#if p.problem}
                            <Button
                              size="sm"
                              variant="outline"
                              href="/activities/{act._id}/{p.problem._id}"
                              class="h-7 border-border bg-card px-2.5 text-[11px] font-semibold text-foreground hover:bg-muted"
                            >
                              <BookOpenIcon class="mr-1 h-3 w-3 shrink-0 text-primary" />
                              {p.problem.title}
                            </Button>
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/if}
                </Card.Content>

                <Card.Footer class="flex items-center justify-end border-t border-border/30 bg-muted/5 pt-3 pb-3">
                  <Button size="sm" href="/activities/{act._id}" class="text-xs font-semibold shadow-xs">
                    Enter Activity Room
                  </Button>
                </Card.Footer>
              </Card.Root>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Right: Section Info & Members Registry -->
      <div class="flex flex-col gap-6">
        <!-- Section Info Card -->
        <Card.Root class="border border-border bg-card">
          <Card.Header class="border-b border-border/40 pb-3">
            <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
              >Class Description</Card.Title
            >
          </Card.Header>
          <Card.Content class="pt-4 text-sm leading-relaxed text-foreground/90">
            {section.aboutMd || 'No class syllabus description has been provided.'}
          </Card.Content>
        </Card.Root>

        <!-- Instructor Profile Card -->
        <Card.Root class="border border-border bg-card">
          <Card.Header class="border-b border-border/40 pb-3">
            <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
              >Assigned Faculty</Card.Title
            >
          </Card.Header>
          <Card.Content class="pt-4">
            {#if sectionTeachers.length === 0}
              <div class="text-xs text-muted-foreground italic">No instructor assigned</div>
            {:else}
              <div class="flex items-center gap-3">
                <Avatar.Root class="h-10 w-10 border border-border shadow-xs">
                  <Avatar.Image src={sectionTeachers[0]?.avatarUrl} alt={sectionTeachers[0]?.name} />
                  <Avatar.Fallback class="bg-primary/5 text-xs font-bold text-primary">
                    {sectionTeachers[0]?.name.substring(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="flex flex-col">
                  <span class="text-sm leading-none font-semibold text-foreground">{sectionTeachers[0]?.name}</span>
                  <span class="mt-1.5 text-xs leading-none text-muted-foreground">{sectionTeachers[0]?.email}</span>
                </div>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Student Registry Registry -->
        <Card.Root class="border border-border bg-card">
          <Card.Header class="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-3">
            <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase">Classmates</Card.Title>
            <Badge variant="secondary" class="border-border bg-muted/40 px-1.5 py-0 text-[10px] font-bold">
              {sectionStudents.length} Students
            </Badge>
          </Card.Header>
          <Card.Content class="max-h-[300px] overflow-y-auto pt-4">
            {#if sectionStudents.length === 0}
              <div class="text-xs text-muted-foreground italic">No students enrolled</div>
            {:else}
              <div class="flex flex-col gap-3">
                {#each sectionStudents.filter(Boolean) as student (student._id)}
                  {#if student}
                    <div class="flex items-center gap-2.5">
                      <Avatar.Root class="h-7 w-7 border border-border">
                        <Avatar.Image src={student.avatarUrl} alt={student.name} />
                        <Avatar.Fallback class="bg-primary/5 text-[9px] font-bold text-primary">
                          {student.name.substring(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <span class="text-xs font-semibold text-foreground">{student.name}</span>
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  {/if}
</div>

<!-- ================= Create Activity Dialog ================= -->
<Dialog.Root bind:open={createActivityOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Add Class Activity</Dialog.Title>
      <Dialog.Description>Schedule a coding exam or live lecture class for this section.</Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-4 py-4">
      <!-- Title -->
      <div class="grid gap-1.5">
        <Label for="act-title" class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >Activity Title</Label
        >
        <Input
          id="act-title"
          placeholder="e.g. Midterm 1: Sorting Algorithms"
          class="h-10 border-border bg-card"
          bind:value={newActivity.title}
          disabled={isSubmitting}
        />
      </div>

      <!-- Type Switch -->
      <div class="grid gap-1.5">
        <Label class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Activity Type</Label>
        <div class="grid grid-cols-2 rounded-lg border border-border bg-muted/20 p-1">
          <button
            type="button"
            class="rounded-md py-1.5 text-center text-xs font-semibold tracking-wider uppercase transition-all duration-200 {newActivity.type ===
            'class'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'}"
            onclick={() => (newActivity.type = 'class')}
          >
            Live Lesson / Homework
          </button>
          <button
            type="button"
            class="rounded-md py-1.5 text-center text-xs font-semibold tracking-wider uppercase transition-all duration-200 {newActivity.type ===
            'exam'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'}"
            onclick={() => (newActivity.type = 'exam')}
          >
            Timed Exam
          </button>
        </div>
      </div>

      <!-- Start Schedule -->
      <div class="grid grid-cols-2 gap-3">
        <div class="grid gap-1.5">
          <Label for="start-date" class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
            >Start Date</Label
          >
          <Input
            id="start-date"
            type="date"
            class="h-10 border-border bg-card"
            bind:value={newActivity.startDate}
            disabled={isSubmitting}
          />
        </div>
        <div class="grid gap-1.5">
          <Label for="start-time" class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
            >Start Time</Label
          >
          <Input
            id="start-time"
            type="time"
            class="h-10 border-border bg-card"
            bind:value={newActivity.startTime}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <!-- End Schedule -->
      <div class="grid grid-cols-2 gap-3">
        <div class="grid gap-1.5">
          <Label for="end-date" class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
            >End Date</Label
          >
          <Input
            id="end-date"
            type="date"
            class="h-10 border-border bg-card"
            bind:value={newActivity.endDate}
            disabled={isSubmitting}
          />
        </div>
        <div class="grid gap-1.5">
          <Label for="end-time" class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
            >End Time</Label
          >
          <Input
            id="end-time"
            type="time"
            class="h-10 border-border bg-card"
            bind:value={newActivity.endTime}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (createActivityOpen = false)} disabled={isSubmitting}>Cancel</Button>
      <Button onclick={handleCreateActivity} disabled={isSubmitting}>
        {#if isSubmitting}
          <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Creating...
        {:else}
          Add Activity
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
