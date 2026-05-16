<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { BookOpen, Edit, MoreHorizontal, Plus, Search, Trash2, User, UserCog, Users } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';

  import { api } from '$convex/_generated/api.js';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';

  // --- Data ---
  const client = useConvexClient();
  const sectionsQuery = useQuery(api.sections.listWithDetails, {});
  const teachersQuery = useQuery(api.users.listByRole, { role: 'teacher' });

  let searchQuery = $state('');

  // --- UI State ---
  let isAddDialogOpen = $state(false);
  let isEditDialogOpen = $state(false);
  let isDeleteDialogOpen = $state(false);
  let isStudentsDialogOpen = $state(false);

  let isSubmitting = $state(false);

  // Form State
  let form = $state({
    id: '',
    name: '',
    aboutMd: '',
    teacherId: '',
  });

  let sectionToDelete = $state<any>(null);
  let sectionForStudents = $state<any>(null);

  // --- Students Data ---
  const enrolledStudents = useQuery(api.sections.listStudents, () => {
    if (!sectionForStudents) return 'skip';
    return { sectionId: sectionForStudents._id };
  });

  // --- Computed ---
  const sections = $derived(sectionsQuery.data ?? []);
  const teachers = $derived(teachersQuery.data ?? []);

  const filteredSections = $derived(
    sections.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.teacher?.name.toLowerCase() || '').includes(searchQuery.toLowerCase()),
    ),
  );

  // --- Handlers ---
  function openAddDialog() {
    form = { id: '', name: '', aboutMd: '', teacherId: '' };
    isAddDialogOpen = true;
  }

  function openEditDialog(section: any) {
    form = {
      id: section._id,
      name: section.name,
      aboutMd: section.aboutMd ?? '',
      teacherId: section.teacher?._id ?? '',
    };
    isEditDialogOpen = true;
  }

  function openStudentsDialog(section: any) {
    sectionForStudents = section;
    isStudentsDialogOpen = true;
  }

  function confirmDelete(section: any) {
    sectionToDelete = section;
    isDeleteDialogOpen = true;
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Section name is required');
      return;
    }

    isSubmitting = true;
    try {
      const sectionId = await client.mutation(api.sections.create, {
        name: form.name,
        aboutMd: form.aboutMd || undefined,
      });

      if (form.teacherId) {
        await client.mutation(api.sections.setTeacher, {
          sectionId,
          teacherId: form.teacherId as any,
        });
      }

      toast.success('Section created successfully');
      isAddDialogOpen = false;
    } catch (e) {
      toast.error('Failed to create section');
      console.error(e);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUpdate() {
    if (!form.name.trim()) return;

    isSubmitting = true;
    try {
      await client.mutation(api.sections.update, {
        id: form.id as any,
        name: form.name,
        aboutMd: form.aboutMd || undefined,
      });

      if (form.teacherId) {
        await client.mutation(api.sections.setTeacher, {
          sectionId: form.id as any,
          teacherId: form.teacherId as any,
        });
      }

      toast.success('Section updated successfully');
      isEditDialogOpen = false;
    } catch (e) {
      toast.error('Failed to update section');
      console.error(e);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete() {
    if (!sectionToDelete) return;

    isSubmitting = true;
    try {
      await client.mutation(api.sections.remove, { id: sectionToDelete._id });
      toast.success('Section deleted successfully');
      isDeleteDialogOpen = false;
    } catch (e) {
      toast.error('Failed to delete section');
      console.error(e);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="container mx-auto space-y-8 p-6" in:fade>
  <!-- Header -->
  <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Section Management</h1>
      <p class="text-muted-foreground">Manage course sections and assign teachers.</p>
    </div>
    <Button onclick={openAddDialog} class="gap-2">
      <Plus class="h-4 w-4" />
      Create Section
    </Button>
  </div>

  <!-- Search and Stats -->
  <div class="flex items-center gap-4">
    <div class="relative w-full max-w-sm">
      <Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
      <Input type="search" placeholder="Search sections or teachers..." class="pl-8" bind:value={searchQuery} />
    </div>
  </div>

  <!-- Sections Table -->
  <Card.Root>
    <Card.Content class="p-0">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Section Name</Table.Head>
            <Table.Head>Assigned Teacher</Table.Head>
            <Table.Head>Enrolled</Table.Head>
            <Table.Head>Created At</Table.Head>
            <Table.Head class="text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if sectionsQuery.isLoading}
            {#each Array(5) as _}
              <Table.Row>
                <Table.Cell><Skeleton class="h-4 w-48" /></Table.Cell>
                <Table.Cell><Skeleton class="h-4 w-32" /></Table.Cell>
                <Table.Cell><Skeleton class="h-4 w-12" /></Table.Cell>
                <Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
                <Table.Cell class="text-right"><Skeleton class="ml-auto h-8 w-16" /></Table.Cell>
              </Table.Row>
            {/each}
          {:else if filteredSections.length === 0}
            <Table.Row>
              <Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">No sections found.</Table.Cell>
            </Table.Row>
          {:else}
            {#each filteredSections as section (section._id)}
              <Table.Row>
                <Table.Cell class="font-medium">
                  <div class="flex items-center gap-2">
                    <BookOpen class="h-4 w-4 text-primary" />
                    {section.name}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {#if section.teacher}
                    <div class="flex items-center gap-2">
                      <div
                        class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700"
                      >
                        {section.teacher.name.charAt(0)}
                      </div>
                      <span class="text-sm">{section.teacher.name}</span>
                    </div>
                  {:else}
                    <Badge variant="outline" class="text-muted-foreground">Unassigned</Badge>
                  {/if}
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 gap-1 px-2 text-xs"
                    onclick={() => openStudentsDialog(section)}
                  >
                    <Users class="h-3 w-3" />
                    {section.studentCount} students
                  </Button>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {new Date(section.createdAt).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell class="text-right">
                  <div class="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onclick={() => openEditDialog(section)}>
                      <Edit class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onclick={() => confirmDelete(section)}
                      class="text-destructive hover:text-destructive"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>
</div>

<!-- Create Dialog -->
<Dialog.Root bind:open={isAddDialogOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Create New Section</Dialog.Title>
      <Dialog.Description>Enter section details and assign a teacher.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="flex flex-col gap-2">
        <label for="name" class="text-sm font-medium">Section Name</label>
        <Input id="name" placeholder="e.g. CSE 1111: Section A" bind:value={form.name} />
      </div>
      <div class="flex flex-col gap-2">
        <label for="teacher" class="text-sm font-medium">Assign Teacher</label>
        <Select.Root type="single" bind:value={form.teacherId}>
          <Select.Trigger class="w-full">
            <div class="flex items-center gap-2">
              <User class="h-3 w-3 text-muted-foreground" />
              <span>{teachers.find((t) => t._id === form.teacherId)?.name ?? 'Select Teacher'}</span>
            </div>
          </Select.Trigger>
          <Select.Content>
            {#each teachers as teacher}
              <Select.Item value={teacher._id} label={teacher.name}>{teacher.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <div class="flex flex-col gap-2">
        <label for="about" class="text-sm font-medium">About (Optional)</label>
        <Textarea id="about" placeholder="Course description or section notes..." bind:value={form.aboutMd} />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isAddDialogOpen = false)} disabled={isSubmitting}>Cancel</Button>
      <Button onclick={handleCreate} disabled={isSubmitting || !form.name.trim()}>
        {#if isSubmitting}
          <Spinner class="mr-2 h-4 w-4" />
          Creating...
        {:else}
          Create Section
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root bind:open={isEditDialogOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Edit Section</Dialog.Title>
      <Dialog.Description>Update section info or change the assigned teacher.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="flex flex-col gap-2">
        <label for="edit-name" class="text-sm font-medium">Section Name</label>
        <Input id="edit-name" bind:value={form.name} />
      </div>
      <div class="flex flex-col gap-2">
        <label for="edit-teacher" class="text-sm font-medium">Assign Teacher</label>
        <Select.Root type="single" bind:value={form.teacherId}>
          <Select.Trigger class="w-full">
            <div class="flex items-center gap-2">
              <User class="h-3 w-3 text-muted-foreground" />
              <span>{teachers.find((t) => t._id === form.teacherId)?.name ?? 'Select Teacher'}</span>
            </div>
          </Select.Trigger>
          <Select.Content>
            {#each teachers as teacher}
              <Select.Item value={teacher._id} label={teacher.name}>{teacher.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <div class="flex flex-col gap-2">
        <label for="edit-about" class="text-sm font-medium">About (Optional)</label>
        <Textarea id="edit-about" bind:value={form.aboutMd} />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isEditDialogOpen = false)} disabled={isSubmitting}>Cancel</Button>
      <Button onclick={handleUpdate} disabled={isSubmitting || !form.name.trim()}>
        {#if isSubmitting}
          <Spinner class="mr-2 h-4 w-4" />
          Saving...
        {:else}
          Save Changes
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Section?</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete <span class="font-bold text-foreground">{sectionToDelete?.name}</span>? This
        will remove all teacher and student assignments for this section.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={isSubmitting}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={handleDelete}
        class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <Spinner class="mr-2 h-4 w-4 text-current" />
          Deleting...
        {:else}
          Delete Section
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Students List Dialog -->
<Dialog.Root bind:open={isStudentsDialogOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Enrolled Students</Dialog.Title>
      <Dialog.Description>
        Viewing students for <span class="font-bold text-foreground">{sectionForStudents?.name}</span>
      </Dialog.Description>
    </Dialog.Header>
    <div class="max-h-[400px] overflow-y-auto py-4">
      {#if enrolledStudents.isLoading}
        <div class="flex flex-col gap-3">
          {#each Array(3) as _}
            <div class="flex items-center gap-3">
              <Skeleton class="h-8 w-8 rounded-full" />
              <div class="space-y-1">
                <Skeleton class="h-3 w-32" />
                <Skeleton class="h-2 w-48" />
              </div>
            </div>
          {/each}
        </div>
      {:else if !enrolledStudents.data || enrolledStudents.data.length === 0}
        <div class="py-8 text-center text-muted-foreground">No students are currently enrolled in this section.</div>
      {:else}
        <div class="flex flex-col gap-1">
          {#each enrolledStudents.data.filter((s) => s !== null) as student (student._id)}
            <div class="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                >
                  {student.name.charAt(0)}
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{student.name}</span>
                  <span class="text-xs text-muted-foreground">{student.email}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isStudentsDialogOpen = false)}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
