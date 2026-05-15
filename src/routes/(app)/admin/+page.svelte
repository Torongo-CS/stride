<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { Filter, Megaphone, MessageSquare, Search, Send, ShieldAlert, UserCheck, Users } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import { fade, slide } from 'svelte/transition';

  import { api } from '$convex/_generated/api.js';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { session } from '$lib/session';

  // --- Data ---
  const client = useConvexClient();
  const usersQuery = useQuery(api.users.list, {});

  let searchQuery = $state('');
  let roleFilter = $state<'all' | 'admin' | 'teacher' | 'student'>('all');

  // --- UI State ---
  let isBroadcastOpen = $state(false);
  let broadcastContent = $state('');
  let broadcastRole = $state<'all' | 'admin' | 'teacher' | 'student'>('all');
  let isSendingBroadcast = $state(false);

  let isDMOpen = $state(false);
  let dmTargetUser = $state<any>(null);
  let dmContent = $state('');
  let isSendingDM = $state(false);

  // --- Computed ---
  const users = $derived(usersQuery.data ?? []);
  const filteredUsers = $derived(
    users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    }),
  );

  const stats = $derived({
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    teachers: users.filter((u) => u.role === 'teacher').length,
    students: users.filter((u) => u.role === 'student').length,
  });

  // --- Handlers ---
  async function handleBroadcast() {
    if (!broadcastContent.trim() || !$session?.userId) return;

    isSendingBroadcast = true;
    try {
      await client.mutation(api.messages.broadcast, {
        senderId: $session.userId,
        content: broadcastContent,
        role: broadcastRole === 'all' ? undefined : broadcastRole,
      });
      toast.success(`Broadcast sent successfully to ${broadcastRole === 'all' ? 'all users' : broadcastRole + 's'}!`);
      broadcastContent = '';
      isBroadcastOpen = false;
    } catch (e) {
      toast.error('Failed to send broadcast');
      console.error(e);
    } finally {
      isSendingBroadcast = false;
    }
  }

  async function handleSendDM() {
    if (!dmContent.trim() || !dmTargetUser || !$session?.userId) return;

    isSendingDM = true;
    try {
      const chatId = await client.mutation(api.chats.create, {
        name: `DM: ${dmTargetUser.name}`,
        memberIds: [$session.userId, dmTargetUser._id],
      });

      await client.mutation(api.messages.send, {
        chatId,
        senderId: $session.userId,
        content: dmContent,
      });

      toast.success(`Message sent to ${dmTargetUser.name}`);
      dmContent = '';
      isDMOpen = false;
    } catch (e) {
      toast.error('Failed to send message');
      console.error(e);
    } finally {
      isSendingDM = false;
    }
  }

  function openDM(user: any) {
    dmTargetUser = user;
    isDMOpen = true;
  }
</script>

<div class="container mx-auto space-y-8 p-6" in:fade>
  <!-- Header -->
  <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">System Overview</h1>
      <p class="text-muted-foreground">Manage users and system-wide communications.</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" onclick={() => (isBroadcastOpen = true)} class="gap-2">
        <Megaphone class="h-4 w-4" />
        Broadcast
      </Button>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Total Users</Card.Title>
        <Users class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats.total}</div>
        <p class="text-xs text-muted-foreground">Registered in the system</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Administrators</Card.Title>
        <ShieldAlert class="h-4 w-4 text-primary" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats.admins}</div>
        <p class="text-xs text-muted-foreground">System managers</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Teachers</Card.Title>
        <UserCheck class="h-4 w-4 text-blue-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats.teachers}</div>
        <p class="text-xs text-muted-foreground">Course instructors</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Students</Card.Title>
        <Users class="h-4 w-4 text-green-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats.students}</div>
        <p class="text-xs text-muted-foreground">Active learners</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- User Management Table -->
  <Card.Root>
    <Card.Header>
      <div class="flex items-center justify-between">
        <Card.Title>User Directory</Card.Title>
        <div class="flex items-center gap-2">
          <div class="relative w-64">
            <Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search users..." class="pl-8" bind:value={searchQuery} />
          </div>
          <Select.Root type="single" bind:value={roleFilter}>
            <Select.Trigger class="w-[140px] border-primary/20 bg-primary/5 capitalize hover:bg-primary/10">
              <div class="flex items-center gap-2">
                <Filter class="h-3 w-3 text-muted-foreground" />
                <span>{roleFilter === 'all' ? 'All Roles' : roleFilter}</span>
              </div>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all" label="All Roles">All Roles</Select.Item>
              <Select.Item value="admin" label="Admin">Admin</Select.Item>
              <Select.Item value="teacher" label="Teacher">Teacher</Select.Item>
              <Select.Item value="student" label="Student">Student</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      </div>
    </Card.Header>
    <Card.Content>
      <div class="rounded-md border">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>User</Table.Head>
              <Table.Head>Role</Table.Head>
              <Table.Head>Joined</Table.Head>
              <Table.Head class="text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if usersQuery.isLoading}
              {#each Array(5) as _}
                <Table.Row>
                  <Table.Cell><div class="h-4 w-32 animate-pulse rounded bg-muted"></div></Table.Cell>
                  <Table.Cell><div class="h-4 w-16 animate-pulse rounded bg-muted"></div></Table.Cell>
                  <Table.Cell><div class="h-4 w-24 animate-pulse rounded bg-muted"></div></Table.Cell>
                  <Table.Cell class="text-right"
                    ><div class="ml-auto h-8 w-20 animate-pulse rounded bg-muted"></div></Table.Cell
                  >
                </Table.Row>
              {/each}
            {:else if filteredUsers.length === 0}
              <Table.Row>
                <Table.Cell colspan={4} class="h-24 text-center text-muted-foreground">
                  No users found matching your criteria.
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each filteredUsers as user (user._id)}
                <Table.Row>
                  <Table.Cell>
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary"
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div class="flex flex-col">
                        <span class="font-medium">{user.name}</span>
                        <span class="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant={user.role === 'admin'
                        ? 'destructive'
                        : user.role === 'teacher'
                          ? 'default'
                          : 'secondary'}
                    >
                      {user.role}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell class="text-right">
                    {#if user._id !== $session?.userId}
                      <Button variant="ghost" size="sm" class="gap-2" onclick={() => openDM(user)}>
                        <MessageSquare class="h-4 w-4" />
                        Message
                      </Button>
                    {/if}
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </Card.Content>
  </Card.Root>
</div>

<!-- Broadcast Dialog -->
<Dialog.Root bind:open={isBroadcastOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Broadcast Message</Dialog.Title>
      <Dialog.Description>This message will be sent to every user in the system individually.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="flex flex-col gap-2">
        <label for="broadcast-role" class="text-sm font-medium">Target Audience</label>
        <Select.Root type="single" bind:value={broadcastRole}>
          <Select.Trigger class="w-full">
            <div class="flex items-center gap-2">
              <span
                >{broadcastRole === 'all'
                  ? 'All Users'
                  : broadcastRole.charAt(0).toUpperCase() + broadcastRole.slice(1)}</span
              >
            </div>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" label="All Users">All Users</Select.Item>
            <Select.Item value="admin" label="Admin">Admin</Select.Item>
            <Select.Item value="teacher" label="Teacher">Teacher</Select.Item>
            <Select.Item value="student" label="Student">Student</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div class="flex flex-col gap-2">
        <label for="broadcast-msg" class="text-sm font-medium">Message Content</label>
        <Textarea
          id="broadcast-msg"
          placeholder="Type your announcement here..."
          class="min-h-[150px]"
          bind:value={broadcastContent}
        />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isBroadcastOpen = false)} disabled={isSendingBroadcast}>Cancel</Button>
      <Button onclick={handleBroadcast} disabled={isSendingBroadcast || !broadcastContent.trim()}>
        {#if isSendingBroadcast}
          <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Sending...
        {:else}
          <Send class="mr-2 h-4 w-4" />
          Send Broadcast
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Individual DM Dialog -->
<Dialog.Root bind:open={isDMOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Message {dmTargetUser?.name}</Dialog.Title>
      <Dialog.Description>
        Send a direct message to {dmTargetUser?.email}.
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="flex flex-col gap-2">
        <label for="dm-msg" class="text-sm font-medium">Message</label>
        <Textarea
          id="dm-msg"
          placeholder={`Hello ${dmTargetUser?.name.split(' ')[0]}...`}
          class="min-h-[100px]"
          bind:value={dmContent}
        />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isDMOpen = false)} disabled={isSendingDM}>Cancel</Button>
      <Button onclick={handleSendDM} disabled={isSendingDM || !dmContent.trim()}>
        {#if isSendingDM}
          <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Sending...
        {:else}
          <Send class="mr-2 h-4 w-4" />
          Send Message
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  :global(body) {
    background-color: hsl(var(--background));
  }
</style>
