<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import SaveIcon from '@lucide/svelte/icons/save';
  import SearchIcon from '@lucide/svelte/icons/search';
  import UserCheckIcon from '@lucide/svelte/icons/user-check';
  import UserXIcon from '@lucide/svelte/icons/user-x';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { page } from '$app/stores';
  import { api } from '$convex/_generated/api.js';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();
  const sectionId = $derived($page.params.sectionId as any);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const sectionQuery = useQuery(api.sections.get, () => (sectionId ? { id: sectionId } : 'skip'));
  const sectionTeachersQuery = useQuery(api.sections.listTeachers, () => (sectionId ? { sectionId } : 'skip'));
  const sectionStudentsQuery = useQuery(api.sections.listStudents, () => (sectionId ? { sectionId } : 'skip'));
  const usersQuery = useQuery(api.users.list, () => (userRole === 'admin' ? {} : 'skip'));

  // --- Reactive Derived States ---
  const section = $derived(sectionQuery.data);
  const sectionTeachers = $derived((sectionTeachersQuery.data || []).filter(Boolean) as any[]);
  const sectionStudents = $derived((sectionStudentsQuery.data || []).filter(Boolean) as any[]);
  const users = $derived(usersQuery.data || []);

  const teachers = $derived(users.filter((u) => u.role === 'teacher'));
  const students = $derived(users.filter((u) => u.role === 'student'));

  // --- Search / Filter Lists ---
  let activeTab = $state('info'); // 'info' | 'faculty' | 'students'
  let teacherSearchQuery = $state('');
  let studentSearchQuery = $state('');
  let teacherToAssignId = $state('');
  let studentToEnrollId = $state('');

  let name = $state('');
  let aboutMd = $state('');
  let isSubmitting = $state(false);

  // Sync loaded section data into local form states
  $effect(() => {
    if (section) {
      name = section.name;
      aboutMd = section.aboutMd || '';
    }
  });

  const availableTeachers = $derived(
    teachers.filter((t) => !sectionTeachers.some((assigned: any) => assigned?._id === t._id)),
  );

  const availableTeachersFiltered = $derived(
    availableTeachers.filter(
      (t) =>
        t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearchQuery.toLowerCase()),
    ),
  );

  const availableStudents = $derived(
    students.filter((s) => !sectionStudents.some((enrolled: any) => enrolled?._id === s._id)),
  );

  const availableStudentsFiltered = $derived(
    availableStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()),
    ),
  );

  const isLoading = $derived(
    sectionQuery.isLoading ||
      sectionTeachersQuery.isLoading ||
      sectionStudentsQuery.isLoading ||
      (userRole === 'admin' && usersQuery.isLoading),
  );

  // --- Operations ---
  async function handleUpdateSection() {
    if (!name.trim()) {
      toast.error('Section name is required');
      return;
    }
    isSubmitting = true;
    try {
      await client.mutation(api.sections.update, {
        id: sectionId,
        name: name.trim(),
        aboutMd: aboutMd.trim() || undefined,
      });
      toast.success('Section info updated successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update section info');
    } finally {
      isSubmitting = false;
    }
  }

  async function assignTeacher() {
    if (!teacherToAssignId) return;
    try {
      await client.mutation(api.sections.addTeacher, {
        sectionId,
        teacherId: teacherToAssignId as any,
      });
      toast.success('Teacher assigned successfully');
      teacherToAssignId = '';
    } catch (e) {
      console.error(e);
      toast.error('Failed to assign teacher');
    }
  }

  async function removeTeacher(teacherId: string) {
    try {
      await client.mutation(api.sections.removeTeacher, {
        sectionId,
        teacherId: teacherId as any,
      });
      toast.success('Teacher assignment removed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove teacher');
    }
  }

  async function enrollStudent() {
    if (!studentToEnrollId) return;
    try {
      await client.mutation(api.sections.addStudent, {
        sectionId,
        studentId: studentToEnrollId as any,
      });
      toast.success('Student enrolled successfully');
      studentToEnrollId = '';
    } catch (e) {
      console.error(e);
      toast.error('Failed to enroll student');
    }
  }

  async function removeStudent(studentId: string) {
    try {
      await client.mutation(api.sections.removeStudent, {
        sectionId,
        studentId: studentId as any,
      });
      toast.success('Student unenrolled');
    } catch (e) {
      console.error(e);
      toast.error('Failed to unenroll student');
    }
  }
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 md:p-8">
  <!-- Header / Navigation -->
  <div class="flex items-center justify-between">
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
        <Card.Description
          >Only administrators are authorized to manage section settings and enrollments.</Card.Description
        >
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections List
        </Button>
      </Card.Content>
    </Card.Root>
  {:else if isLoading}
    <div class="flex flex-col gap-6">
      <Card.Root>
        <Card.Header class="gap-2">
          <Skeleton class="h-8 w-1/3" />
          <Skeleton class="h-4 w-1/2" />
        </Card.Header>
        <Card.Content class="gap-4">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-28 w-full" />
        </Card.Content>
      </Card.Root>
    </div>
  {:else if !section}
    <Card.Root class="border-border p-8 text-center">
      <Card.Header>
        <Card.Title class="text-lg font-bold text-foreground">Section Not Found</Card.Title>
        <Card.Description>The section you are attempting to edit does not exist in the database.</Card.Description>
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Master Header -->
    <div class="flex flex-col gap-1 border-b border-border/40 pb-4">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">Edit Section: {section.name}</h1>
      <p class="text-xs text-muted-foreground">Manage course details, instructors, and student memberships.</p>
    </div>

    <!-- Layout Grid -->
    <div class="grid gap-6 md:grid-cols-4">
      <!-- Left side: Navigation Tabs -->
      <div class="flex flex-col gap-1 md:col-span-1">
        <button
          onclick={() => (activeTab = 'info')}
          class="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-bold tracking-wider uppercase transition-all duration-200 {activeTab ===
          'info'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          <BookOpenIcon class="h-4 w-4" />
          General Info
        </button>
        <button
          onclick={() => (activeTab = 'faculty')}
          class="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-bold tracking-wider uppercase transition-all duration-200 {activeTab ===
          'faculty'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          <UsersIcon class="h-4 w-4" />
          Faculty
        </button>
        <button
          onclick={() => (activeTab = 'students')}
          class="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-bold tracking-wider uppercase transition-all duration-200 {activeTab ===
          'students'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          <UsersIcon class="h-4 w-4" />
          Students ({sectionStudents.length})
        </button>
      </div>

      <!-- Right side: Tab Panel Content -->
      <div class="md:col-span-3">
        <!-- 1. GENERAL INFORMATION TAB -->
        {#if activeTab === 'info'}
          <Card.Root class="border border-border bg-card">
            <Card.Header>
              <Card.Title class="text-lg font-bold text-foreground">Course details</Card.Title>
              <Card.Description>Update the section title and overall syllabus description.</Card.Description>
            </Card.Header>
            <Card.Content class="grid gap-4">
              <div class="grid gap-2">
                <Label for="section-name" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                  >Section Title</Label
                >
                <Input id="section-name" class="h-10 border-border bg-card" bind:value={name} disabled={isSubmitting} />
              </div>
              <div class="grid gap-2">
                <Label for="section-desc" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                  >Syllabus & Details</Label
                >
                <Textarea
                  id="section-desc"
                  rows={6}
                  class="resize-y border-border bg-card"
                  bind:value={aboutMd}
                  disabled={isSubmitting}
                />
              </div>
            </Card.Content>
            <Card.Footer class="flex items-center justify-end border-t border-border/40 py-3">
              <Button onclick={handleUpdateSection} disabled={isSubmitting} class="h-9 text-xs font-bold shadow-xs">
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
        {/if}

        <!-- 2. FACULTY ASSIGNMENTS TAB -->
        {#if activeTab === 'faculty'}
          <div class="flex flex-col gap-6">
            <!-- Assign Instructor Card -->
            {#if sectionTeachers.length === 0}
              <Card.Root class="border border-border bg-card">
                <Card.Header>
                  <Card.Title class="text-lg font-bold text-foreground">Assign Instructor</Card.Title>
                  <Card.Description
                    >Add a teaching instructor to manage lessons and review code submissions.</Card.Description
                  >
                </Card.Header>
                <Card.Content class="flex flex-col gap-4">
                  <!-- Search Available Teachers -->
                  <div class="relative">
                    <SearchIcon class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search available teachers by name..."
                      class="h-10 bg-card pl-9 text-xs"
                      bind:value={teacherSearchQuery}
                    />
                  </div>
                  <div class="flex gap-2">
                    <select
                      class="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                      bind:value={teacherToAssignId}
                    >
                      <option value="">-- Choose Teacher --</option>
                      {#each availableTeachersFiltered as teacher (teacher._id)}
                        <option value={teacher._id}>{teacher.name} ({teacher.email})</option>
                      {/each}
                    </select>
                    <Button onclick={assignTeacher} disabled={!teacherToAssignId} class="h-10 px-5 font-bold shadow-xs">
                      <UserCheckIcon class="mr-1.5 h-4 w-4" />
                      Assign
                    </Button>
                  </div>
                </Card.Content>
              </Card.Root>
            {/if}

            <!-- Current Instructor Card -->
            <Card.Root class="border border-border bg-card">
              <Card.Header>
                <Card.Title class="text-lg font-bold text-foreground">Assigned Faculty</Card.Title>
                <Card.Description>The assigned instructor for this course section.</Card.Description>
              </Card.Header>
              <Card.Content>
                {@const activeTeacher = sectionTeachers[0]}
                {#if activeTeacher}
                  <div class="flex items-center justify-between rounded-md border border-border bg-muted/10 p-4">
                    <div class="flex items-center gap-3">
                      <Avatar.Root class="h-12 w-12 border border-border shadow-xs">
                        <Avatar.Image src={activeTeacher.avatarUrl} alt={activeTeacher.name} />
                        <Avatar.Fallback class="bg-primary/5 text-sm font-bold text-primary">
                          {activeTeacher.name.substring(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div class="flex flex-col">
                        <span class="text-sm leading-none font-semibold text-foreground">{activeTeacher.name}</span>
                        <span class="mt-1.5 text-xs leading-none text-muted-foreground">{activeTeacher.email}</span>
                        <Badge
                          variant="secondary"
                          class="mt-2 w-fit border-none bg-primary/10 text-[10px] font-bold text-primary uppercase"
                        >
                          Class Instructor
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      class="border-border text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
                      onclick={() => removeTeacher(activeTeacher._id)}
                    >
                      <UserXIcon class="mr-1.5 h-3.5 w-3.5" />
                      Remove Assignment
                    </Button>
                  </div>
                {/if}
              </Card.Content>
            </Card.Root>
          </div>
        {/if}

        <!-- 3. STUDENT ENROLLMENTS TAB -->
        {#if activeTab === 'students'}
          <div class="flex flex-col gap-6">
            <!-- Enroll Student Card -->
            <Card.Root class="border border-border bg-card">
              <Card.Header>
                <Card.Title class="text-lg font-bold text-foreground">Enroll New Student</Card.Title>
                <Card.Description>Search and enroll an existing user as a student in this section.</Card.Description>
              </Card.Header>
              <Card.Content class="flex flex-col gap-4">
                <div class="relative">
                  <SearchIcon class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search students by name or email..."
                    class="h-10 bg-card pl-9 text-xs"
                    bind:value={studentSearchQuery}
                  />
                </div>
                <div class="flex gap-2">
                  <select
                    class="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    bind:value={studentToEnrollId}
                  >
                    <option value="">-- Choose Student --</option>
                    {#each availableStudentsFiltered as student (student._id)}
                      <option value={student._id}>{student.name} ({student.email})</option>
                    {/each}
                  </select>
                  <Button onclick={enrollStudent} disabled={!studentToEnrollId} class="h-10 px-5 font-bold shadow-xs">
                    <UserCheckIcon class="mr-1.5 h-4 w-4" />
                    Enroll
                  </Button>
                </div>
              </Card.Content>
            </Card.Root>

            <!-- Student Registry -->
            <Card.Root class="border border-border bg-card">
              <Card.Header>
                <Card.Title class="text-lg font-bold text-foreground"
                  >Enrolled Students ({sectionStudents.length})</Card.Title
                >
                <Card.Description>The list of students active in this section.</Card.Description>
              </Card.Header>
              <Card.Content>
                {#if sectionStudents.length === 0}
                  <div
                    class="rounded-lg border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground italic"
                  >
                    No students are currently enrolled in this section.
                  </div>
                {:else}
                  <div class="divide-y divide-border/40 overflow-hidden rounded-md border border-border bg-card">
                    {#each sectionStudents.filter(Boolean) as student (student._id)}
                      {#if student}
                        <div class="flex items-center justify-between p-3.5">
                          <div class="flex items-center gap-3">
                            <Avatar.Root class="h-8 w-8 border border-border">
                              <Avatar.Image src={student.avatarUrl} alt={student.name} />
                              <Avatar.Fallback class="bg-primary/5 text-xs font-bold text-primary">
                                {student.name.substring(0, 2).toUpperCase()}
                              </Avatar.Fallback>
                            </Avatar.Root>
                            <div class="flex flex-col">
                              <span class="text-sm leading-none font-semibold text-foreground">{student.name}</span>
                              <span class="mt-1 text-xs leading-none text-muted-foreground">{student.email}</span>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            class="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onclick={() => removeStudent(student._id)}
                            title="Unenroll Student"
                          >
                            <UserXIcon class="h-4 w-4" />
                          </Button>
                        </div>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </Card.Content>
            </Card.Root>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
