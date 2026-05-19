<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import UserCogIcon from '@lucide/svelte/icons/user-cog';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { api } from '$convex/_generated/api.js';
  import type { Doc } from '$convex/_generated/dataModel.js';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { m } from '$lib/paraglide/messages.js';

  const client = useConvexClient();
  const usersQuery = useQuery(api.users.list, {});

  let searchQuery = $state('');

  const filteredUsers = $derived(
    usersQuery.data?.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [],
  );

  // Edit User State
  let editingUser = $state<Doc<'users'> | null>(null);
  let editDialogOpen = $state(false);
  let isSaving = $state(false);

  function openEditDialog(user: Doc<'users'>) {
    editingUser = { ...user };
    editDialogOpen = true;
  }

  async function handleUpdateUser() {
    if (!editingUser) return;
    isSaving = true;
    try {
      await client.mutation(api.users.update, {
        id: editingUser._id,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        aboutMd: editingUser.aboutMd,
        avatarUrl: editingUser.avatarUrl,
      });
      toast.success(m.admin_users_toast_update_success());
      editDialogOpen = false;
    } catch (error) {
      console.error(error);
      toast.error(m.admin_users_toast_update_fail());
    } finally {
      isSaving = false;
    }
  }

  // Delete User State
  let deletingUser = $state<Doc<'users'> | null>(null);
  let deleteDialogOpen = $state(false);
  let isDeleting = $state(false);

  function confirmDelete(user: Doc<'users'> | null) {
    if (!user) return;
    deletingUser = user;
    deleteDialogOpen = true;
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;
    isDeleting = true;
    try {
      await client.mutation(api.users.remove, { id: deletingUser._id });
      toast.success(m.admin_users_toast_delete_success());
      deleteDialogOpen = false;
    } catch (error) {
      console.error(error);
      toast.error(m.admin_users_toast_delete_fail());
    } finally {
      isDeleting = false;
    }
  }

  // Create User State
  let newUser = $state<{
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'admin';
    aboutMd: string;
    avatarUrl: string;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'student',
    aboutMd: '',
    avatarUrl: '',
  });
  let addDialogOpen = $state(false);
  let isCreating = $state(false);

  function openAddDialog() {
    newUser = {
      name: '',
      email: '',
      password: '',
      role: 'student',
      aboutMd: '',
      avatarUrl: '',
    };
    addDialogOpen = true;
  }

  async function handleCreateUser() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error(m.admin_users_toast_fill_required());
      return;
    }
    isCreating = true;
    try {
      await client.mutation(api.users.create, {
        name: newUser.name,
        email: newUser.email,
        passwordHash: newUser.password,
        role: newUser.role,
        aboutMd: newUser.aboutMd || undefined,
        avatarUrl: newUser.avatarUrl || undefined,
      });
      toast.success(m.admin_users_toast_create_success());
      addDialogOpen = false;
    } catch (error) {
      console.error(error);
      toast.error(m.admin_users_toast_create_fail());
    } finally {
      isCreating = false;
    }
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const roles = $derived([
    { value: 'student', label: m.admin_users_role_student() },
    { value: 'teacher', label: m.admin_users_role_teacher() },
    { value: 'admin', label: m.admin_users_role_admin() },
  ]);
</script>

<div class="flex h-full flex-col gap-6 p-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">{m.admin_users_title()}</h1>
      <p class="text-muted-foreground">{m.admin_users_subtitle()}</p>
    </div>
    <Button onclick={openAddDialog}>
      <PlusIcon class="mr-2 h-4 w-4" />
      {m.admin_users_btn_create()}
    </Button>
  </div>

  <div class="flex items-center gap-4">
    <div class="relative w-full max-w-sm">
      <SearchIcon class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
      <Input placeholder={m.admin_users_search_placeholder()} class="pl-8" bind:value={searchQuery} />
    </div>
  </div>

  <div class="rounded-md border bg-card">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[80px]">Avatar</Table.Head>
          <Table.Head>{m.admin_users_label_name()}</Table.Head>
          <Table.Head>{m.admin_users_label_email()}</Table.Head>
          <Table.Head>{m.admin_users_table_role()}</Table.Head>
          <Table.Head>{m.admin_users_table_joined()}</Table.Head>
          <Table.Head class="text-right">{m.admin_users_table_actions()}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if usersQuery.isLoading}
          {#each [0, 1, 2, 3, 4] as i (i)}
            <Table.Row>
              <Table.Cell><Skeleton class="h-10 w-10 rounded-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-[150px]" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-[200px]" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-[80px]" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-[100px]" /></Table.Cell>
              <Table.Cell class="text-right"><Skeleton class="ml-auto h-8 w-8" /></Table.Cell>
            </Table.Row>
          {/each}
        {:else if filteredUsers.length === 0}
          <Table.Row>
            <Table.Cell colspan={6} class="h-24 text-center">No users found.</Table.Cell>
          </Table.Row>
        {:else}
          {#each filteredUsers as user (user._id)}
            <Table.Row>
              <Table.Cell>
                <Avatar.Root>
                  <Avatar.Image src={user.avatarUrl} alt={user.name} />
                  <Avatar.Fallback>{user.name.substring(0, 2).toUpperCase()}</Avatar.Fallback>
                </Avatar.Root>
              </Table.Cell>
              <Table.Cell class="font-medium">{user.name}</Table.Cell>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>
                <Badge
                  variant={user.role === 'admin' ? 'default' : user.role === 'teacher' ? 'secondary' : 'outline'}
                  class="capitalize"
                >
                  {user.role === 'admin'
                    ? m.admin_users_role_admin()
                    : user.role === 'teacher'
                      ? m.admin_users_role_teacher()
                      : m.admin_users_role_student()}
                </Badge>
              </Table.Cell>
              <Table.Cell>{formatDate(user.createdAt)}</Table.Cell>
              <Table.Cell class="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onclick={() => openEditDialog(user)}
                  title={m.admin_users_tooltip_edit()}
                >
                  <UserCogIcon class="h-4 w-4" />
                  <span class="sr-only">{m.admin_users_tooltip_edit()}</span>
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </div>
</div>

<!-- Edit User Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
  <Dialog.Content class="sm:max-w-[525px]">
    <Dialog.Header>
      <Dialog.Title>{m.admin_users_dialog_edit_title()}</Dialog.Title>
      <Dialog.Description>{m.admin_users_dialog_edit_desc()}</Dialog.Description>
    </Dialog.Header>
    {#if editingUser}
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="name" class="text-right">{m.admin_users_label_name()}</Label>
          <Input id="name" bind:value={editingUser.name} class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="email" class="text-right">{m.admin_users_label_email()}</Label>
          <Input id="email" bind:value={editingUser.email} class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="role" class="text-right">{m.admin_users_table_role()}</Label>
          <div class="col-span-3">
            <Select.Root type="single" bind:value={editingUser.role}>
              <Select.Trigger class="col-span-3">
                {roles.find((r) => r.value === editingUser?.role)?.label ?? 'Select role'}
              </Select.Trigger>
              <Select.Content>
                {#each roles as role (role.value)}
                  <Select.Item value={role.value} label={role.label}>{role.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="avatarUrl" class="text-right">Avatar URL</Label>
          <Input id="avatarUrl" bind:value={editingUser.avatarUrl} class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-start gap-4">
          <Label for="about" class="pt-2 text-right">{m.admin_users_label_about()}</Label>
          <Textarea id="about" bind:value={editingUser.aboutMd} class="col-span-3" rows={4} />
        </div>
      </div>
    {/if}
    <Dialog.Footer class="flex items-center justify-between">
      <Button variant="destructive" onclick={() => confirmDelete(editingUser)} disabled={isSaving || isDeleting}>
        <Trash2Icon class="mr-2 h-4 w-4" />
        {m.admin_users_tooltip_delete()}
      </Button>
      <div class="flex items-center gap-2">
        <Button variant="outline" onclick={() => (editDialogOpen = false)}>{m.admin_users_btn_cancel()}</Button>
        <Button type="submit" onclick={handleUpdateUser} disabled={isSaving}>
          {#if isSaving}
            <Spinner class="mr-2 h-4 w-4" />
            {m.admin_users_btn_saving()}
          {:else}
            {m.admin_users_btn_save()}
          {/if}
        </Button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete User Alert Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{m.admin_users_dialog_delete_title()}</AlertDialog.Title>
      <AlertDialog.Description>
        {m.admin_users_dialog_delete_desc()}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>{m.admin_users_btn_cancel()}</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={async () => {
          await handleDeleteUser();
          editDialogOpen = false;
        }}
        class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
        disabled={isDeleting}
      >
        {#if isDeleting}
          <Spinner class="mr-2 h-4 w-4 text-current" />
          {m.admin_users_btn_deleting()}
        {:else}
          {m.admin_users_tooltip_delete()}
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Add User Dialog -->
<Dialog.Root bind:open={addDialogOpen}>
  <Dialog.Content class="sm:max-w-[525px]">
    <Dialog.Header>
      <Dialog.Title>{m.admin_users_dialog_create_title()}</Dialog.Title>
      <Dialog.Description>{m.admin_users_dialog_create_desc()}</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="new-name" class="text-right">{m.admin_users_label_name()}</Label>
        <Input id="new-name" bind:value={newUser.name} class="col-span-3" placeholder="John Doe" />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="new-email" class="text-right">{m.admin_users_label_email()}</Label>
        <Input
          id="new-email"
          type="email"
          bind:value={newUser.email}
          class="col-span-3"
          placeholder="john@example.com"
        />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="new-password" class="text-right">{m.admin_users_label_password()}</Label>
        <Input
          id="new-password"
          type="password"
          bind:value={newUser.password}
          class="col-span-3"
          placeholder="••••••••"
        />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="new-role" class="text-right">{m.admin_users_table_role()}</Label>
        <div class="col-span-3">
          <Select.Root type="single" bind:value={newUser.role}>
            <Select.Trigger class="w-full">
              {roles.find((r) => r.value === newUser.role)?.label ?? 'Select role'}
            </Select.Trigger>
            <Select.Content>
              {#each roles as role (role.value)}
                <Select.Item value={role.value} label={role.label}>{role.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="new-avatarUrl" class="text-right">Avatar URL</Label>
        <Input id="new-avatarUrl" bind:value={newUser.avatarUrl} class="col-span-3" placeholder="https://..." />
      </div>
      <div class="grid grid-cols-4 items-start gap-4">
        <Label for="new-about" class="pt-2 text-right">{m.admin_users_label_about()}</Label>
        <Textarea id="new-about" bind:value={newUser.aboutMd} class="col-span-3" rows={3} placeholder="User bio..." />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (addDialogOpen = false)}>{m.admin_users_btn_cancel()}</Button>
      <Button type="submit" onclick={handleCreateUser} disabled={isCreating}>
        {#if isCreating}
          <Spinner class="mr-2 h-4 w-4" />
          {m.admin_users_btn_creating()}
        {:else}
          {m.admin_users_btn_create()}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
