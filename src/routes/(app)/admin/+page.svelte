<script lang="ts">
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
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

  // --- Real-time Convex Queries ---
  const usersQuery = useQuery(api.users.list, {});
  const problemsQuery = useQuery(api.problems.list, {});
  const postsQuery = useQuery(api.posts.list, {});

  // --- Reactive Derived States (Svelte 5 Runes) ---
  const users = $derived(usersQuery.data || []);
  const problems = $derived(problemsQuery.data || []);
  const posts = $derived(postsQuery.data || []);

  const studentCount = $derived(users.filter((u) => u.role === 'student').length);
  const teacherCount = $derived(users.filter((u) => u.role === 'teacher').length);
  const adminCount = $derived(users.filter((u) => u.role === 'admin').length);
  const totalCount = $derived(users.length);

  const isLoading = $derived(usersQuery.isLoading || problemsQuery.isLoading || postsQuery.isLoading);

  // --- Helpers ---
  function getAuthor(authorId: string) {
    return users.find((u) => u._id === authorId);
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<div class="flex flex-col gap-8 p-6 md:p-8">
  <!-- Top Header Section -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">Admin Overview</h1>
      <p class="text-sm text-muted-foreground">
        Real-time system statistics, forum activity, and quick management links.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-success shadow-xs"
      >
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
        </span>
        Live Sync Active
      </div>
    </div>
  </div>

  <!-- Premium Metrics Cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <!-- Enrolled Students Card -->
    <Card.Root
      class="relative overflow-hidden border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium text-muted-foreground">Enrolled Students</Card.Title>
        <div class="rounded-full bg-primary/10 p-2 text-primary">
          <GraduationCapIcon class="h-5 w-5" />
        </div>
      </Card.Header>
      <Card.Content>
        {#if isLoading}
          <Skeleton class="h-8 w-16" />
        {:else}
          <div class="text-2xl font-bold tracking-tight text-foreground">{studentCount}</div>
          <p class="mt-1 text-xs text-muted-foreground">Active course participants</p>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Faculty Members Card -->
    <Card.Root
      class="relative overflow-hidden border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium text-muted-foreground">Faculty & Teachers</Card.Title>
        <div class="rounded-full bg-primary/10 p-2 text-primary">
          <UsersIcon class="h-5 w-5" />
        </div>
      </Card.Header>
      <Card.Content>
        {#if isLoading}
          <Skeleton class="h-8 w-16" />
        {:else}
          <div class="text-2xl font-bold tracking-tight text-foreground">{teacherCount}</div>
          <p class="mt-1 text-xs text-muted-foreground">Managing class sections</p>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Programming Challenges Card -->
    <Card.Root
      class="relative overflow-hidden border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium text-muted-foreground">Coding Problems</Card.Title>
        <div class="rounded-full bg-primary/10 p-2 text-primary">
          <FileCodeIcon class="h-5 w-5" />
        </div>
      </Card.Header>
      <Card.Content>
        {#if isLoading}
          <Skeleton class="h-8 w-16" />
        {:else}
          <div class="text-2xl font-bold tracking-tight text-foreground">{problems.length}</div>
          <p class="mt-1 text-xs text-muted-foreground">Challenges in database</p>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Discussion Threads Card -->
    <Card.Root
      class="relative overflow-hidden border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium text-muted-foreground">Forum Inquiries</Card.Title>
        <div class="rounded-full bg-primary/10 p-2 text-primary">
          <MessageSquareIcon class="h-5 w-5" />
        </div>
      </Card.Header>
      <Card.Content>
        {#if isLoading}
          <Skeleton class="h-8 w-16" />
        {:else}
          <div class="text-2xl font-bold tracking-tight text-foreground">{posts.length}</div>
          <p class="mt-1 text-xs text-muted-foreground">Student support discussions</p>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Dashboard Main Body Grid -->
  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Left Column: Community Discussion Stream (Spans 2) -->
    <div class="flex flex-col gap-4 lg:col-span-2">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Recent Forum Activity</h2>
        <Badge variant="outline" class="border-border text-xs font-semibold text-muted-foreground">Latest Posts</Badge>
      </div>

      <div class="flex flex-col gap-4">
        {#if isLoading}
          {#each Array(3) as _, i (i)}
            <Card.Root class="border border-border bg-card">
              <Card.Content class="flex gap-4 p-6">
                <Skeleton class="h-10 w-10 rounded-full" />
                <div class="flex flex-1 flex-col gap-2">
                  <Skeleton class="h-4 w-1/4" />
                  <Skeleton class="h-4 w-full" />
                  <Skeleton class="h-3 w-1/2" />
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        {:else if posts.length === 0}
          <Card.Root class="border border-border bg-card p-12 text-center">
            <Card.Content class="flex flex-col items-center justify-center gap-3">
              <MessageSquareIcon class="h-8 w-8 text-muted-foreground" />
              <p class="text-sm font-semibold text-muted-foreground">No recent posts found</p>
              <p class="text-xs text-muted-foreground">The student discussion board is currently quiet.</p>
            </Card.Content>
          </Card.Root>
        {:else}
          {#each posts as post (post._id)}
            {@const author = getAuthor(post.authorId)}
            <Card.Root class="border border-border bg-card transition-all duration-200 hover:shadow-xs">
              <Card.Content class="flex flex-col gap-4 p-6">
                <!-- Post Author Header -->
                <div class="flex items-center gap-3">
                  {#if author}
                    <Avatar.Root class="h-9 w-9 border border-border shadow-xs">
                      <Avatar.Image src={author.avatarUrl} alt={author.name} />
                      <Avatar.Fallback class="bg-primary/5 text-xs font-bold text-primary">
                        {author.name.substring(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        <span class="text-sm leading-none font-semibold text-foreground">{author.name}</span>
                        <Badge
                          variant={author.role === 'admin'
                            ? 'default'
                            : author.role === 'teacher'
                              ? 'secondary'
                              : 'outline'}
                          class="h-4 px-1.5 py-0 text-[10px] leading-none font-bold tracking-wider uppercase"
                        >
                          {author.role}
                        </Badge>
                      </div>
                      <span class="mt-0.5 text-[11px] text-muted-foreground">{formatDate(post.createdAt)}</span>
                    </div>
                  {:else}
                    <Avatar.Root class="h-9 w-9 border border-border">
                      <Avatar.Fallback class="text-xs">U</Avatar.Fallback>
                    </Avatar.Root>
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-foreground">Unknown Author</span>
                      <span class="text-[11px] text-muted-foreground">{formatDate(post.createdAt)}</span>
                    </div>
                  {/if}
                </div>

                <!-- Post Text -->
                <p class="line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {post.contentMd}
                </p>
              </Card.Content>
            </Card.Root>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Right Column: System Controls & Access Indicators -->
    <div class="flex flex-col gap-6">
      <!-- Quick Operations Card -->
      <Card.Root class="border border-border bg-card">
        <Card.Header class="border-b border-border/40 pb-3">
          <Card.Title class="text-base font-bold text-foreground">Quick Actions</Card.Title>
          <Card.Description class="text-xs">Direct paths to administrative pages.</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-3 pt-4">
          <Button
            variant="outline"
            href="/admin/users"
            class="w-full justify-between border-border text-sm font-medium hover:bg-muted/50"
          >
            <span class="flex items-center gap-2">
              <UserCogIcon class="h-4 w-4 text-muted-foreground" />
              Manage User Profiles
            </span>
            <ArrowRightIcon class="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            href="/settings"
            class="w-full justify-between border-border text-sm font-medium hover:bg-muted/50"
          >
            <span class="flex items-center gap-2">
              <ShieldCheckIcon class="h-4 w-4 text-muted-foreground" />
              Admin Access Settings
            </span>
            <ArrowRightIcon class="h-4 w-4 text-muted-foreground" />
          </Button>
        </Card.Content>
      </Card.Root>

      <!-- Database Sync Metrics -->
      <Card.Root class="border border-border bg-card">
        <Card.Header class="border-b border-border/40 pb-3">
          <Card.Title class="text-base font-bold text-foreground">Database Records</Card.Title>
          <Card.Description class="text-xs">Count of live synced collections.</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-4 pt-4">
          <!-- Total Users Indicator -->
          <div class="flex items-center justify-between border-b border-border/30 pb-2">
            <div class="flex items-center gap-2">
              <CheckCircle2Icon class="h-4 w-4 text-success" />
              <span class="text-xs font-semibold text-foreground">Users Collection</span>
            </div>
            {#if isLoading}
              <Skeleton class="h-4 w-8" />
            {:else}
              <div class="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span>{totalCount} doc(s)</span>
                <Badge
                  variant="outline"
                  class="h-4 border-border bg-muted/20 px-1 py-0 text-[10px] font-bold text-muted-foreground"
                >
                  {adminCount} Admins
                </Badge>
              </div>
            {/if}
          </div>

          <!-- Total Problems Indicator -->
          <div class="flex items-center justify-between border-b border-border/30 pb-2">
            <div class="flex items-center gap-2">
              <CheckCircle2Icon class="h-4 w-4 text-success" />
              <span class="text-xs font-semibold text-foreground">Problems Collection</span>
            </div>
            {#if isLoading}
              <Skeleton class="h-4 w-8" />
            {:else}
              <span class="text-xs font-semibold text-muted-foreground">{problems.length} doc(s)</span>
            {/if}
          </div>

          <!-- Total Posts Indicator -->
          <div class="flex items-center justify-between pb-1">
            <div class="flex items-center gap-2">
              <CheckCircle2Icon class="h-4 w-4 text-success" />
              <span class="text-xs font-semibold text-foreground">Forum Posts Collection</span>
            </div>
            {#if isLoading}
              <Skeleton class="h-4 w-8" />
            {:else}
              <span class="text-xs font-semibold text-muted-foreground">{posts.length} doc(s)</span>
            {/if}
          </div>
        </Card.Content>
      </Card.Root>

      <!-- System Integrity Indicator Card -->
      <Card.Root class="border border-border bg-card">
        <Card.Content class="flex items-start gap-3 p-4">
          <div class="rounded-full bg-success/15 p-2 text-success">
            <ActivityIcon class="h-5 w-5 animate-pulse" />
          </div>
          <div class="flex flex-col gap-0.5">
            <h4 class="text-xs font-bold text-foreground">Convex Real-Time Stream</h4>
            <p class="text-[11px] leading-normal text-muted-foreground">
              Direct connection securely maintained. Database changes instantly refresh your local display.
            </p>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
