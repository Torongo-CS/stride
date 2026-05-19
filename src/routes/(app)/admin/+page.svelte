<script lang="ts">
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import FlameIcon from '@lucide/svelte/icons/flame';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import PlayIcon from '@lucide/svelte/icons/play';
  import TerminalIcon from '@lucide/svelte/icons/terminal';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { useQuery } from 'convex-svelte';

  import { api } from '$convex/_generated/api.js';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { m } from '$lib/paraglide/messages.js';

  // --- Real-time Convex Stats Query ---
  const statsQuery = useQuery(api.admin.getDashboardStats, {});
  const stats = $derived(statsQuery.data);
  const isLoading = $derived(statsQuery.isLoading);

  // --- Chart Layout Variables ---
  const height = 160;
  const width = 600;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const trend = $derived(stats?.submissionTrend || []);
  const maxVal = $derived(Math.max(...trend.map((t) => t.value), 10));

  const points = $derived(
    trend.map((t, idx) => {
      const x = paddingLeft + (idx * (width - paddingLeft - paddingRight)) / (trend.length - 1 || 1);
      const y = height - paddingBottom - (t.value * (height - paddingTop - paddingBottom)) / maxVal;
      return { x, y, label: t.label, value: t.value };
    }),
  );

  const linePath = $derived(
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
          points
            .slice(1)
            .map((p) => `L ${p.x} ${p.y}`)
            .join(' ')
      : '',
  );

  const areaPath = $derived(
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : '',
  );

  // Tooltip Interaction Rune
  let hoveredPointIdx = $state<number | null>(null);

  // System composition percentage calculations
  const totalR = $derived(stats?.counts?.users || 1);
  const studentPct = $derived(stats ? Math.round((stats.userRoles.student / totalR) * 100) : 0);
  const teacherPct = $derived(stats ? Math.round((stats.userRoles.teacher / totalR) * 100) : 0);
  const adminPct = $derived(stats ? Math.round((stats.userRoles.admin / totalR) * 100) : 0);

  // Format Helper for Timestamps
  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="flex-1 space-y-8 p-8 pt-6">
  <!-- Top Header -->
  <div class="flex items-center justify-between space-y-2">
    <div>
      <h2 class="text-3xl font-bold tracking-tight text-foreground">{m.admin_dashboard_title()}</h2>
      <p class="text-sm text-muted-foreground">
        {m.admin_dashboard_subtitle()}
      </p>
    </div>
  </div>

  {#if isLoading}
    <!-- Stat Grid Skeleton -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {#each Array(4) as _}
        <Card.Root class="p-6">
          <div class="flex items-center justify-between">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-8 w-8 rounded-full" />
          </div>
          <Skeleton class="mt-4 h-8 w-16" />
          <Skeleton class="mt-2 h-4 w-32" />
        </Card.Root>
      {/each}
    </div>

    <!-- Chart & Distribution Skeleton -->
    <div class="grid gap-6 md:grid-cols-7">
      <Card.Root class="col-span-4 p-6">
        <Skeleton class="mb-4 h-6 w-48" />
        <Skeleton class="h-[160px] w-full" />
      </Card.Root>
      <Card.Root class="col-span-3 p-6">
        <Skeleton class="mb-4 h-6 w-48" />
        <Skeleton class="h-[160px] w-full" />
      </Card.Root>
    </div>

    <!-- Recent Lists Skeleton -->
    <div class="grid gap-6 md:grid-cols-2">
      <Card.Root class="p-6">
        <Skeleton class="mb-4 h-6 w-48" />
        <div class="space-y-4">
          {#each Array(3) as _}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Skeleton class="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton class="mb-1 h-4 w-32" />
                  <Skeleton class="h-3 w-24" />
                </div>
              </div>
              <Skeleton class="h-6 w-16" />
            </div>
          {/each}
        </div>
      </Card.Root>
      <Card.Root class="p-6">
        <Skeleton class="mb-4 h-6 w-48" />
        <div class="space-y-4">
          {#each Array(3) as _}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Skeleton class="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton class="mb-1 h-4 w-32" />
                  <Skeleton class="h-3 w-24" />
                </div>
              </div>
              <Skeleton class="h-6 w-16" />
            </div>
          {/each}
        </div>
      </Card.Root>
    </div>
  {:else if stats}
    <!-- Stat Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- Users Card -->
      <Card.Root
        class="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground">{m.admin_dashboard_total_users()}</Card.Title>
          <div class="rounded-full bg-primary/10 p-2 text-primary">
            <UsersIcon class="h-4 w-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-3xl font-extrabold tracking-tight text-foreground">{stats.counts.users}</div>
          <div class="mt-3 space-y-1">
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>Student: <strong>{stats.userRoles.student}</strong></span>
              <span>Teacher: <strong>{stats.userRoles.teacher}</strong></span>
            </div>
            <!-- Progress Bar -->
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full bg-primary transition-all"
                style="width: {stats.userRoles.student + stats.userRoles.teacher > 0
                  ? (stats.userRoles.student / (stats.userRoles.student + stats.userRoles.teacher)) * 100
                  : 0}%"
              ></div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Sections Card -->
      <Card.Root
        class="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground">{m.admin_dashboard_total_sections()}</Card.Title
          >
          <div class="rounded-full bg-orange-500/10 p-2 text-orange-500">
            <BookOpenIcon class="h-4 w-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-3xl font-extrabold tracking-tight text-foreground">{stats.counts.sections}</div>
          <p class="mt-2 text-xs text-muted-foreground">Academic classrooms & courses</p>
        </Card.Content>
      </Card.Root>

      <!-- Problems & Activities Card -->
      <Card.Root
        class="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground">{m.admin_dashboard_total_problems()}</Card.Title
          >
          <div class="rounded-full bg-yellow-500/10 p-2 text-yellow-500">
            <TerminalIcon class="h-4 w-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-3xl font-extrabold tracking-tight text-foreground">{stats.counts.problems}</div>
          <div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Exams: <strong>{stats.activityTypes.exam}</strong></span>
            <span>Classes: <strong>{stats.activityTypes.class}</strong></span>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Submissions Card -->
      <Card.Root
        class="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground"
            >{m.admin_dashboard_total_submissions()}</Card.Title
          >
          <div class="rounded-full bg-emerald-500/10 p-2 text-emerald-500">
            <PlayIcon class="h-4 w-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-3xl font-extrabold tracking-tight text-foreground">{stats.counts.submissions}</div>
          <p class="mt-2 text-xs text-muted-foreground">
            Accepted: <span class="font-semibold text-emerald-500">{stats.submissionVerdicts['Accepted'] || 0}</span>
            / Total
          </p>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Charts / Trend Section -->
    <div class="grid gap-6 md:grid-cols-7">
      <!-- Submission Activity Line Chart -->
      <Card.Root class="col-span-4 border-border/40 bg-card/60 p-6 backdrop-blur-md">
        <Card.Header class="p-0 pb-4">
          <Card.Title class="flex items-center gap-2 text-base font-semibold">
            <ActivityIcon class="h-4 w-4 text-primary" />
            {m.admin_dashboard_weekly_submissions()}
          </Card.Title>
        </Card.Header>
        <Card.Content class="relative p-0">
          <!-- Interactive SVG Line Chart -->
          <svg {width} {height} viewBox="0 0 {width} {height}" class="w-full overflow-visible">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--color-primary, #f97316)" stop-opacity="0.25" />
                <stop offset="100%" stop-color="var(--color-primary, #f97316)" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- Grid Lines (Horizontal) -->
            {#each [0, 0.25, 0.5, 0.75, 1] as ratio}
              {@const y = paddingTop + ratio * (height - paddingTop - paddingBottom)}
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                class="text-border/20"
                stroke-dasharray="4 4"
              />
              <!-- Y-Axis Values -->
              <text
                x={paddingLeft - 8}
                {y}
                text-anchor="end"
                dominant-baseline="middle"
                class="fill-muted-foreground text-[10px] font-medium"
              >
                {Math.round(maxVal * (1 - ratio))}
              </text>
            {/each}

            <!-- X-Axis line -->
            <line
              x1={paddingLeft}
              y1={height - paddingBottom}
              x2={width - paddingRight}
              y2={height - paddingBottom}
              stroke="currentColor"
              class="text-border/40"
            />

            <!-- Filled Area -->
            {#if areaPath}
              <path d={areaPath} fill="url(#areaGrad)" />
            {/if}

            <!-- Trend Line -->
            {#if linePath}
              <path
                d={linePath}
                fill="none"
                stroke="var(--color-primary, #f97316)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            {/if}

            <!-- Data Point Circles and Labels -->
            {#each points as pt, i}
              <!-- Axis Label -->
              <text
                x={pt.x}
                y={height - paddingBottom + 16}
                text-anchor="middle"
                class="fill-muted-foreground text-[10px] font-medium"
              >
                {pt.label}
              </text>

              <!-- Circle dot -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredPointIdx === i ? 6 : 4}
                class="fill-card stroke-primary transition-all duration-200"
                stroke-width={hoveredPointIdx === i ? 3 : 2}
                onmouseenter={() => (hoveredPointIdx = i)}
                onmouseleave={() => (hoveredPointIdx = null)}
              />

              <!-- Hover interaction overlay area for easier selection -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <rect
                x={pt.x - 20}
                y={paddingTop}
                width="40"
                height={height - paddingTop - paddingBottom}
                fill="transparent"
                class="cursor-pointer"
                onmouseenter={() => (hoveredPointIdx = i)}
                onmouseleave={() => (hoveredPointIdx = null)}
              />
            {/each}
          </svg>

          <!-- Floating Tooltip popup -->
          {#if hoveredPointIdx !== null && points[hoveredPointIdx]}
            {@const activePt = points[hoveredPointIdx]}
            <div
              class="pointer-events-none absolute z-10 rounded-md border border-border/80 bg-popover p-2 text-xs shadow-md transition-all"
              style="left: {(activePt.x / width) * 100}%; top: {(activePt.y / height) *
                100}%; transform: translate(-50%, -120%);"
            >
              <div class="font-semibold text-foreground">{activePt.label}</div>
              <div class="mt-0.5 text-muted-foreground">
                Submissions: <span class="font-bold text-primary">{activePt.value}</span>
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- System Composition Ring Chart -->
      <Card.Root class="col-span-3 border-border/40 bg-card/60 p-6 backdrop-blur-md">
        <Card.Header class="p-0 pb-4">
          <Card.Title class="flex items-center gap-2 text-base font-semibold">
            <FlameIcon class="h-4 w-4 text-orange-500" />
            System Composition
          </Card.Title>
        </Card.Header>
        <Card.Content class="flex h-[160px] flex-col justify-between p-0">
          <!-- Percentage breakdown bars -->
          <div class="my-auto w-full space-y-4">
            <!-- Student percent -->

            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="flex items-center gap-1.5 font-medium text-foreground">
                  <span class="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  Students
                </span>
                <span class="text-muted-foreground">{studentPct}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary" style="width: {studentPct}%"></div>
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="flex items-center gap-1.5 font-medium text-foreground">
                  <span class="h-2.5 w-2.5 rounded-full bg-orange-500"></span>
                  Teachers
                </span>
                <span class="text-muted-foreground">{teacherPct}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-orange-500" style="width: {teacherPct}%"></div>
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="flex items-center gap-1.5 font-medium text-foreground">
                  <span class="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                  Admins
                </span>
                <span class="text-muted-foreground">{adminPct}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-yellow-500" style="width: {adminPct}%"></div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Feed / Recent Actions Layout -->
    <div class="grid gap-6 md:grid-cols-2">
      <!-- Recent Activity / Submissions Feed -->
      <Card.Root class="border-border/40 bg-card/60 p-6 backdrop-blur-md">
        <Card.Header class="p-0 pb-4">
          <Card.Title class="flex items-center gap-2 text-base font-semibold">
            <ActivityIcon class="h-4 w-4 text-emerald-500" />
            {m.admin_dashboard_recent_submissions()}
          </Card.Title>
        </Card.Header>
        <Card.Content class="p-0">
          {#if stats.recentSubmissions.length === 0}
            <div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquareIcon class="mb-2 h-8 w-8 text-muted-foreground/45" />
              <p class="text-sm">{m.admin_dashboard_no_activity()}</p>
            </div>
          {:else}
            <div class="divide-y divide-border/20">
              {#each stats.recentSubmissions as sub (sub._id)}
                <div class="group flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div class="flex items-center gap-3">
                    <Avatar.Root
                      class="h-9 w-9 border border-border/40 transition-transform duration-300 group-hover:scale-105"
                    >
                      <Avatar.Image src={sub.authorAvatarUrl} alt={sub.authorName} />
                      <Avatar.Fallback>{sub.authorName.charAt(0)}</Avatar.Fallback>
                    </Avatar.Root>
                    <div>
                      <div class="text-sm font-semibold text-foreground">{sub.authorName}</div>
                      <div class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{sub.problemTitle}</span>
                        <span class="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
                        <span>{formatTime(sub.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={sub.verdict === 'Accepted' ? 'default' : 'destructive'}
                    class="px-2 py-0.5 text-[10px] tracking-wide capitalize"
                  >
                    {sub.verdict}
                  </Badge>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Recent Signups -->
      <Card.Root class="border-border/40 bg-card/60 p-6 backdrop-blur-md">
        <Card.Header class="p-0 pb-4">
          <Card.Title class="flex items-center gap-2 text-base font-semibold">
            <UsersIcon class="h-4 w-4 text-primary" />
            {m.admin_dashboard_recent_users()}
          </Card.Title>
        </Card.Header>
        <Card.Content class="p-0">
          {#if stats.recentUsers.length === 0}
            <div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <UsersIcon class="mb-2 h-8 w-8 text-muted-foreground/45" />
              <p class="text-sm">{m.admin_dashboard_no_activity()}</p>
            </div>
          {:else}
            <div class="divide-y divide-border/20">
              {#each stats.recentUsers as user (user._id)}
                <div class="group flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div class="flex items-center gap-3">
                    <Avatar.Root
                      class="h-9 w-9 border border-border/40 transition-transform duration-300 group-hover:scale-105"
                    >
                      <Avatar.Image src={user.avatarUrl} alt={user.name} />
                      <Avatar.Fallback>{user.name.charAt(0)}</Avatar.Fallback>
                    </Avatar.Root>
                    <div>
                      <div class="text-sm font-semibold text-foreground">{user.name}</div>
                      <div class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{user.email}</span>
                        <span class="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" class="bg-background/50 px-2 py-0.5 text-[10px] tracking-wide capitalize">
                    {user.role}
                  </Badge>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
