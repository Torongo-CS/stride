<script lang="ts">
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
  import FileCodeIcon from '@lucide/svelte/icons/file-code';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import UserCogIcon from '@lucide/svelte/icons/user-cog';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { useQuery } from 'convex-svelte';

  import { api } from '$convex/_generated/api.js';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const userId = $derived($session?.userId);
  const isAdmin = $derived($session?.role === 'admin');

  // --- Core Profile Queries ---
  const userQuery = useQuery(api.users.get, () => (userId ? { id: userId } : 'skip'));
  const studentSectionsQuery = useQuery(api.sections.listSectionsByStudent, () =>
    userId && $session?.role === 'student' ? { studentId: userId } : 'skip',
  );
  const teacherSectionsQuery = useQuery(api.sections.listSectionsByTeacher, () =>
    userId && $session?.role === 'teacher' ? { teacherId: userId } : 'skip',
  );

  // --- Real-time Admin Dashboard Queries ---
  const usersQuery = useQuery(api.users.list, () => (isAdmin ? {} : 'skip'));
  const allSectionsQuery = useQuery(api.sections.listWithMembers, () => (isAdmin ? {} : 'skip'));
  const problemsQuery = useQuery(api.problems.list, () => (isAdmin ? {} : 'skip'));
  const postsQuery = useQuery(api.posts.list, () => (isAdmin ? {} : 'skip'));

  // --- Reactive Derived States (Svelte 5 Runes) ---
  const user = $derived(userQuery.data);
  const sections = $derived(studentSectionsQuery.data || teacherSectionsQuery.data);
  const isLoading = $derived(userQuery.isLoading || studentSectionsQuery.isLoading || teacherSectionsQuery.isLoading);

  // Admin states
  const adminUsers = $derived(usersQuery.data || []);
  const allSections = $derived(allSectionsQuery.data || []);
  const problems = $derived(problemsQuery.data || []);
  const posts = $derived(postsQuery.data || []);

  const studentCount = $derived(adminUsers.filter((u) => u.role === 'student').length);
  const teacherCount = $derived(adminUsers.filter((u) => u.role === 'teacher').length);

  const isAdminLoading = $derived(
    usersQuery.isLoading || allSectionsQuery.isLoading || problemsQuery.isLoading || postsQuery.isLoading,
  );
</script>

<div class="flex flex-col gap-6">
  <!-- Top Header Section -->
  <div class="flex flex-col gap-1 border-b border-border/40 pb-4">
    <h1 class="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
    <p class="text-xs text-muted-foreground">
      {#if $session?.role === 'admin'}
        Real-time system overview and quick action shortcuts.
      {:else}
        Welcome back, {user?.name || 'User'}! Access your active course sections and materials.
      {/if}
    </p>
  </div>

  <!-- Content Section -->
  <div>
    {#if $session?.role === 'admin'}
      <div class="flex flex-col gap-6">
        <!-- Metric Stat Cards -->
        <div class="grid gap-4 sm:grid-cols-3">
          <!-- Total Students -->
          <Card.Root class="border border-border bg-card transition-all hover:shadow-xs">
            <Card.Header class="flex flex-row items-center justify-between pb-2">
              <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Enrolled Students</Card.Title
              >
              <div class="rounded-full bg-primary/10 p-2 text-primary">
                <GraduationCapIcon class="h-4 w-4" />
              </div>
            </Card.Header>
            <Card.Content>
              {#if isAdminLoading}
                <Skeleton class="h-7 w-12" />
              {:else}
                <div class="text-2xl font-bold tracking-tight text-foreground">{studentCount}</div>
                <p class="mt-1 text-[10px] text-muted-foreground">Registered student profiles</p>
              {/if}
            </Card.Content>
          </Card.Root>

          <!-- Faculty Members -->
          <Card.Root class="border border-border bg-card transition-all hover:shadow-xs">
            <Card.Header class="flex flex-row items-center justify-between pb-2">
              <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Faculty Members</Card.Title
              >
              <div class="rounded-full bg-primary/10 p-2 text-primary">
                <UsersIcon class="h-4 w-4" />
              </div>
            </Card.Header>
            <Card.Content>
              {#if isAdminLoading}
                <Skeleton class="h-7 w-12" />
              {:else}
                <div class="text-2xl font-bold tracking-tight text-foreground">{teacherCount}</div>
                <p class="mt-1 text-[10px] text-muted-foreground">Teaching & class instructors</p>
              {/if}
            </Card.Content>
          </Card.Root>

          <!-- Academic Sections -->
          <Card.Root class="border border-border bg-card transition-all hover:shadow-xs">
            <Card.Header class="flex flex-row items-center justify-between pb-2">
              <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Course Sections</Card.Title
              >
              <div class="rounded-full bg-primary/10 p-2 text-primary">
                <BookOpenIcon class="h-4 w-4" />
              </div>
            </Card.Header>
            <Card.Content>
              {#if isAdminLoading}
                <Skeleton class="h-7 w-12" />
              {:else}
                <div class="text-2xl font-bold tracking-tight text-foreground">{allSections.length}</div>
                <p class="mt-1 text-[10px] text-muted-foreground">Active class sections</p>
              {/if}
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Main Body Details -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Left Part: Section Management Overview (Spans 2) -->
          <div class="flex flex-col gap-4 lg:col-span-2">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold tracking-wider text-muted-foreground uppercase">Active Sections Summary</h3>
              <Button href="/sections" variant="outline" size="sm" class="h-7 border-border text-xs">
                Manage Sections
                <ArrowRightIcon class="ml-1 h-3 w-3" />
              </Button>
            </div>

            {#if isAdminLoading}
              <div class="flex flex-col gap-3">
                {#each Array(2) as _, i (i)}
                  <Card.Root class="border border-border bg-card p-4">
                    <Skeleton class="mb-2 h-5 w-1/3" />
                    <Skeleton class="h-4 w-2/3" />
                  </Card.Root>
                {/each}
              </div>
            {:else if allSections.length === 0}
              <div
                class="rounded-lg border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground italic"
              >
                No sections have been created in the database yet.
              </div>
            {:else}
              <div class="grid gap-4 sm:grid-cols-2">
                {#each allSections.slice(0, 4) as section (section._id)}
                  <Card.Root
                    class="flex flex-col justify-between border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-xs"
                  >
                    <Card.Header class="pb-2">
                      <Card.Title class="line-clamp-1 text-sm font-bold tracking-tight text-foreground">
                        {section.name}
                      </Card.Title>
                      <Card.Description class="mt-1 line-clamp-2 text-xs leading-normal">
                        {section.aboutMd || 'No description provided.'}
                      </Card.Description>
                    </Card.Header>
                    <Card.Content class="flex flex-col gap-2 pt-1 pb-3">
                      <div class="flex items-center justify-between border-t border-border/30 pt-2.5 text-[11px]">
                        <span class="font-medium text-muted-foreground">Instructor:</span>
                        {#if section.teachers.length === 0}
                          <span class="text-muted-foreground italic">Unassigned</span>
                        {:else}
                          <span class="font-semibold text-foreground">{section.teachers[0]?.name}</span>
                        {/if}
                      </div>
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="font-medium text-muted-foreground">Enrolled Students:</span>
                        <span class="font-bold text-foreground">{section.students.length} student(s)</span>
                      </div>
                    </Card.Content>
                  </Card.Root>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Right Part: Shortcuts & Integrity -->
          <div class="flex flex-col gap-6">
            <!-- Admin Quick Links -->
            <Card.Root class="border border-border bg-card">
              <Card.Header class="border-b border-border/40 pb-2.5">
                <Card.Title class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                  >Admin Quick Paths</Card.Title
                >
              </Card.Header>
              <Card.Content class="grid gap-2.5 pt-4">
                <Button
                  variant="outline"
                  href="/admin/users"
                  class="h-9 w-full justify-between border-border text-xs font-semibold hover:bg-muted/50"
                >
                  <span class="flex items-center gap-2">
                    <UserCogIcon class="h-3.5 w-3.5 text-muted-foreground" />
                    Manage User Profiles
                  </span>
                  <ArrowRightIcon class="h-3.5 w-3.5 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  href="/sections"
                  class="h-9 w-full justify-between border-border text-xs font-semibold hover:bg-muted/50"
                >
                  <span class="flex items-center gap-2">
                    <BookOpenIcon class="h-3.5 w-3.5 text-muted-foreground" />
                    Section Assignments
                  </span>
                  <ArrowRightIcon class="h-3.5 w-3.5 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  href="/settings"
                  class="h-9 w-full justify-between border-border text-xs font-semibold hover:bg-muted/50"
                >
                  <span class="flex items-center gap-2">
                    <ShieldCheckIcon class="h-3.5 w-3.5 text-muted-foreground" />
                    Admin Access Settings
                  </span>
                  <ArrowRightIcon class="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </Card.Content>
            </Card.Root>
          </div>
        </div>
      </div>
    {:else}
      <!-- EXISTING STUDENT/TEACHER COURSE SECTION GRID -->
      <h2 class="mb-4 text-xl font-semibold">
        {#if $session?.role === 'teacher'}
          Sections You Teach
        {:else if $session?.role === 'student'}
          Your Sections
        {/if}
      </h2>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#if sections}
          {#if sections.length === 0}
            <div
              class="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
            >
              <p class="text-lg font-medium text-muted-foreground">No sections found</p>
              <p class="text-sm text-muted-foreground">You are not enrolled in any sections yet.</p>
            </div>
          {:else}
            {#each sections as section (section?._id)}
              {#if section}
                <Card.Root class="transition-all hover:shadow-md">
                  <Card.Header>
                    <Card.Title>{section.name}</Card.Title>
                    <Card.Description class="line-clamp-2">
                      {#if section.aboutMd}
                        {section.aboutMd}
                      {:else}
                        No description provided.
                      {/if}
                    </Card.Description>
                  </Card.Header>
                  <Card.Footer>
                    <a href="/sections/{section?._id}" class="text-sm font-medium text-primary hover:underline">
                      View Section details →
                    </a>
                  </Card.Footer>
                </Card.Root>
              {/if}
            {/each}
          {/if}
        {:else if isLoading}
          {#each [0, 1, 2] as i (i)}
            <Card.Root>
              <Card.Header class="gap-2">
                <Skeleton class="h-6 w-3/4" />
                <Skeleton class="h-4 w-full" />
              </Card.Header>
              <Card.Footer>
                <Skeleton class="h-4 w-24" />
              </Card.Footer>
            </Card.Root>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>
