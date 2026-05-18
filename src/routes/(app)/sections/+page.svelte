<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import Edit3Icon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import UserCheckIcon from '@lucide/svelte/icons/user-check';
  import UserXIcon from '@lucide/svelte/icons/user-x';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { api } from '$convex/_generated/api.js';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { session } from '$lib/session';

  const userId = $derived($session?.userId);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const client = useConvexClient();
  const sectionsQuery = useQuery(api.sections.listWithMembers, {});
  const usersQuery = useQuery(api.users.list, () => (userRole === 'admin' ? {} : 'skip'));

  // --- Reactive Derived States (Svelte 5 Runes) ---
  const sections = $derived(sectionsQuery.data || []);
  const users = $derived(usersQuery.data || []);

  const teachers = $derived(users.filter((u) => u.role === 'teacher'));
  const students = $derived(users.filter((u) => u.role === 'student'));

  let searchQuery = $state('');

  const roleFilteredSections = $derived(
    sections.filter((section) => {
      if (userRole === 'admin') return true;
      if (userRole === 'teacher') {
        return section.teachers?.some((t: any) => t._id === userId) ?? false;
      }
      if (userRole === 'student') {
        return section.students?.some((s: any) => s._id === userId) ?? false;
      }
      return false;
    }),
  );

  const filteredSections = $derived(
    roleFilteredSections.filter(
      (section) =>
        section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.aboutMd?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  // --- Loader State ---
  const isLoading = $derived(sectionsQuery.isLoading || (userRole === 'admin' && usersQuery.isLoading));

  // --- Modals State ---
  let createDialogOpen = $state(false);
  let editDialogOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let membersDialogOpen = $state(false);

  let isSubmitting = $state(false);

  // --- CRUD Target Details ---
  let newSection = $state({ name: '', aboutMd: '' });
  let editingSection = $state<any>({ _id: '', name: '', aboutMd: '' });
  let deletingSection = $state<any>(null);
  let selectedSectionId = $state<string>('');

  const selectedSection = $derived(sections.find((s) => s._id === selectedSectionId) || null);

  // --- Member Management State ---
  let teacherToAssignId = $state('');
  let studentToEnrollId = $state('');
  let teacherSearchQuery = $state('');
  let studentSearchQuery = $state('');
  let activeTab = $state('faculty');

  // Find available teachers who are not currently assigned to this section
  const availableTeachers = $derived(
    selectedSection
      ? teachers.filter((t) => !selectedSection.teachers.some((assigned: any) => assigned._id === t._id))
      : [],
  );

  const availableTeachersFiltered = $derived(
    availableTeachers.filter(
      (t) =>
        t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearchQuery.toLowerCase()),
    ),
  );

  // Find available students who are not currently enrolled in selected section
  const availableStudents = $derived(
    selectedSection
      ? students.filter((s) => !selectedSection.students.some((enrolled: any) => enrolled._id === s._id))
      : [],
  );

  const availableStudentsFiltered = $derived(
    availableStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()),
    ),
  );

  // --- Operations & Mutations ---

  // 1. Create Section
  function openCreateDialog() {
    newSection = { name: '', aboutMd: '' };
    createDialogOpen = true;
  }

  async function handleCreateSection() {
    if (!newSection.name.trim()) {
      toast.error('Section name is required');
      return;
    }
    isSubmitting = true;
    try {
      await client.mutation(api.sections.create, {
        name: newSection.name,
        aboutMd: newSection.aboutMd || undefined,
      });
      toast.success('Section created successfully');
      createDialogOpen = false;
    } catch (e) {
      console.error(e);
      toast.error('Failed to create section');
    } finally {
      isSubmitting = false;
    }
  }

  // 2. Edit Section Details
  function openEditDialog(section: any) {
    editingSection = {
      _id: section._id,
      name: section.name,
      aboutMd: section.aboutMd || '',
    };
    editDialogOpen = true;
  }

  async function handleUpdateSection() {
    if (!editingSection.name.trim()) {
      toast.error('Section name is required');
      return;
    }
    isSubmitting = true;
    try {
      await client.mutation(api.sections.update, {
        id: editingSection._id,
        name: editingSection.name,
        aboutMd: editingSection.aboutMd || undefined,
      });
      toast.success('Section details updated');
      editDialogOpen = false;
    } catch (e) {
      console.error(e);
      toast.error('Failed to update details');
    } finally {
      isSubmitting = false;
    }
  }

  // 3. Delete Section
  function confirmDelete(section: any) {
    deletingSection = section;
    deleteDialogOpen = true;
  }

  async function handleDeleteSection() {
    if (!deletingSection) return;
    isSubmitting = true;
    try {
      await client.mutation(api.sections.remove, { id: deletingSection._id });
      toast.success('Section deleted successfully');
      deleteDialogOpen = false;
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete section');
    } finally {
      isSubmitting = false;
      deletingSection = null;
    }
  }

  // 4. Open Members Manager
  function openMembersDialog(section: any) {
    selectedSectionId = section._id;
    teacherToAssignId = '';
    studentToEnrollId = '';
    teacherSearchQuery = '';
    studentSearchQuery = '';
    activeTab = 'faculty';
    membersDialogOpen = true;
  }

  // 5. Teachers Management
  async function assignTeacher() {
    if (!selectedSection || !teacherToAssignId) return;
    try {
      await client.mutation(api.sections.addTeacher, {
        sectionId: selectedSection._id,
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
    if (!selectedSection) return;
    try {
      await client.mutation(api.sections.removeTeacher, {
        sectionId: selectedSection._id,
        teacherId: teacherId as any,
      });
      toast.success('Teacher unassigned');
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove assignment');
    }
  }

  // 6. Students Management
  async function enrollStudent() {
    if (!selectedSection || !studentToEnrollId) return;
    try {
      await client.mutation(api.sections.addStudent, {
        sectionId: selectedSection._id,
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
    if (!selectedSection) return;
    try {
      await client.mutation(api.sections.removeStudent, {
        sectionId: selectedSection._id,
        studentId: studentId as any,
      });
      toast.success('Student unenrolled');
    } catch (e) {
      console.error(e);
      toast.error('Failed to unenroll student');
    }
  }
</script>

<div class="flex flex-col gap-6 p-6 md:p-8">
  <!-- Header Bar -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">
        {#if userRole === 'admin'}
          Section Management
        {:else}
          My Sections
        {/if}
      </h1>
      <p class="text-sm text-muted-foreground">
        {#if userRole === 'admin'}
          Create sections, assign teachers, and manage enrolled students.
        {:else}
          Access and view details for the active course sections you are a member of.
        {/if}
      </p>
    </div>
    {#if userRole === 'admin'}
      <Button onclick={openCreateDialog} class="shadow-xs">
        <PlusIcon class="mr-2 h-4 w-4" />
        Create Section
      </Button>
    {/if}
  </div>

  <!-- Search filters -->
  <div class="flex items-center gap-4">
    <div class="relative w-full max-w-sm">
      <SearchIcon class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search sections by name or description..."
        class="border-border bg-card pl-8 shadow-xs"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Section Cards Grid -->
  {#if isLoading}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <Card.Root class="border border-border bg-card">
          <Card.Header class="gap-2">
            <Skeleton class="h-6 w-3/4" />
            <Skeleton class="h-4 w-full" />
          </Card.Header>
          <Card.Content class="gap-4">
            <Skeleton class="h-10 w-24 rounded-full" />
          </Card.Content>
          <Card.Footer class="gap-2">
            <Skeleton class="h-8 w-full" />
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {:else if filteredSections.length === 0}
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-16 text-center"
    >
      <UsersIcon class="mb-3 h-10 w-10 text-muted-foreground/60" />
      <h3 class="text-lg font-bold text-foreground">No sections found</h3>
      <p class="mt-1 text-sm text-muted-foreground">Try modifying your search or create a new section above.</p>
    </div>
  {:else}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredSections as section (section._id)}
        <Card.Root
          class="flex h-full flex-col justify-between border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <Card.Header class="pb-3">
            <div class="flex items-start justify-between gap-4">
              <Card.Title class="line-clamp-1 text-xl font-bold tracking-tight text-foreground">
                {section.name}
              </Card.Title>
            </div>
            <Card.Description class="mt-1 line-clamp-2 text-sm text-muted-foreground/90">
              {section.aboutMd || 'No description provided.'}
            </Card.Description>
          </Card.Header>

          <Card.Content class="flex flex-1 flex-col justify-end gap-4 py-2">
            <!-- Single Instructor Profile -->
            <div class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Instructor</span>
              {#if section.teachers.length === 0}
                <span class="text-xs text-muted-foreground italic">No instructor assigned</span>
              {:else}
                {@const instructor = section.teachers[0]}
                {#if instructor}
                  <div class="flex items-center gap-2 py-0.5">
                    <Avatar.Root class="h-7 w-7 border border-border shadow-xs">
                      <Avatar.Image src={instructor.avatarUrl} alt={instructor.name} />
                      <Avatar.Fallback class="bg-primary/5 text-[9px] font-bold text-primary">
                        {instructor.name.substring(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <span class="text-xs leading-none font-semibold text-foreground">{instructor.name}</span>
                  </div>
                {/if}
              {/if}
            </div>

            <!-- Student Count Badge -->
            <div class="flex items-center justify-between border-t border-border/30 pt-3">
              <span class="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Enrollment</span>
              <Badge variant="secondary" class="border-border bg-muted/40 px-2 py-0.5 text-xs font-bold">
                <GraduationCapIcon class="mr-1 h-3.5 w-3.5" />
                {section.students.length} Student(s)
              </Badge>
            </div>
          </Card.Content>

          <Card.Footer class="flex items-center gap-2 border-t border-border/30 pt-4 pb-4">
            {#if userRole === 'admin'}
              <Button
                size="sm"
                variant="outline"
                onclick={() => openMembersDialog(section)}
                class="flex-1 justify-center border-border text-xs font-semibold hover:bg-muted/50"
              >
                <UsersIcon class="mr-1.5 h-3.5 w-3.5" />
                Members
              </Button>
              <Button
                size="sm"
                variant="outline"
                onclick={() => openEditDialog(section)}
                class="border-border px-2.5 text-xs font-semibold hover:bg-muted/50"
                title="Edit Details"
              >
                <Edit3Icon class="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onclick={() => confirmDelete(section)}
                class="border-border px-2.5 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
                title="Delete Section"
              >
                <Trash2Icon class="h-3.5 w-3.5" />
              </Button>
            {:else}
              <Button size="sm" href="/sections/{section._id}" class="w-full justify-between font-semibold shadow-xs">
                <span>Enter Section Workspace</span>
                <ArrowRightIcon class="h-4 w-4" />
              </Button>
            {/if}
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

<!-- ================= Dialogs Section ================= -->

<!-- 1. Create Section Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Create New Section</Dialog.Title>
      <Dialog.Description>Create an academic section / course listing.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid gap-1.5">
        <Label for="section-name" class="font-semibold">Section Name</Label>
        <Input
          id="section-name"
          placeholder="e.g. CSE 1115: Object Oriented Programming"
          class="border-border bg-card"
          bind:value={newSection.name}
        />
      </div>
      <div class="grid gap-1.5">
        <Label for="section-about" class="font-semibold">Description</Label>
        <Textarea
          id="section-about"
          placeholder="Detailed syllabus or details regarding the class..."
          rows={4}
          class="border-border bg-card"
          bind:value={newSection.aboutMd}
        />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (createDialogOpen = false)} disabled={isSubmitting}>Cancel</Button>
      <Button onclick={handleCreateSection} disabled={isSubmitting}>
        {#if isSubmitting}
          <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Creating...
        {:else}
          Create Section
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- 2. Edit Section Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Edit Section Details</Dialog.Title>
      <Dialog.Description>Modify section metadata.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid gap-1.5">
        <Label for="edit-name" class="font-semibold">Section Name</Label>
        <Input id="edit-name" class="border-border bg-card" bind:value={editingSection.name} />
      </div>
      <div class="grid gap-1.5">
        <Label for="edit-about" class="font-semibold">Description</Label>
        <Textarea id="edit-about" rows={4} class="border-border bg-card" bind:value={editingSection.aboutMd} />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (editDialogOpen = false)} disabled={isSubmitting}>Cancel</Button>
      <Button onclick={handleUpdateSection} disabled={isSubmitting}>
        {#if isSubmitting}
          <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Saving...
        {:else}
          Save Changes
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- 3. Delete Section Alert Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This will permanently delete the section <span class="font-semibold">{deletingSection?.name}</span> and remove all
        teacher assignments and student enrollments. This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={handleDeleteSection}
        class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Deleting...
        {:else}
          Delete Section
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- 4. Manage Members Dialog -->
<Dialog.Root bind:open={membersDialogOpen}>
  <Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-[650px]">
    <Dialog.Header>
      <Dialog.Title class="text-xl leading-tight font-bold">
        Manage Members: {selectedSection?.name}
      </Dialog.Title>
      <Dialog.Description>Assign qualified faculty and enroll students to this section.</Dialog.Description>
    </Dialog.Header>

    <div class="py-4">
      <div class="flex w-full flex-col gap-4">
        <!-- Pure CSS/Tailwind Custom Tabs Header -->
        <div class="grid w-full grid-cols-2 rounded-lg border border-border bg-muted/20 p-1">
          <button
            type="button"
            class="rounded-md py-2 text-center text-xs font-bold tracking-wider uppercase transition-all duration-200 {activeTab ===
            'faculty'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'}"
            onclick={() => (activeTab = 'faculty')}
          >
            Faculty Assignments
          </button>
          <button
            type="button"
            class="rounded-md py-2 text-center text-xs font-bold tracking-wider uppercase transition-all duration-200 {activeTab ===
            'students'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'}"
            onclick={() => (activeTab = 'students')}
          >
            Student Enrollments
          </button>
        </div>

        <!-- A. Faculty (Teachers) Tab -->
        {#if activeTab === 'faculty'}
          <div class="flex flex-col gap-4">
            {#if !selectedSection || selectedSection.teachers.length === 0}
              <!-- NO TEACHER ASSIGNED: Show assign input -->
              <div class="flex flex-col gap-3 rounded-md border border-border bg-muted/10 p-4">
                <h4 class="text-xs font-bold tracking-wider text-foreground uppercase">Assign Instructor</h4>

                <!-- Search Box for Available Teachers -->
                <div class="relative">
                  <SearchIcon class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search available teachers by name or email..."
                    class="h-10 bg-card pl-9 text-xs"
                    bind:value={teacherSearchQuery}
                  />
                </div>

                <div class="flex gap-2">
                  <select
                    class="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    bind:value={teacherToAssignId}
                  >
                    <option value="">-- Choose Teacher --</option>
                    {#each availableTeachersFiltered as teacher (teacher._id)}
                      <option value={teacher._id}>
                        {teacher.name} ({teacher.email})
                      </option>
                    {/each}
                  </select>
                  <Button
                    onclick={assignTeacher}
                    disabled={!teacherToAssignId}
                    class="h-10 shrink-0 px-5 font-bold shadow-xs"
                  >
                    <UserCheckIcon class="mr-1.5 h-4 w-4" />
                    Assign
                  </Button>
                </div>
                {#if availableTeachers.length === 0}
                  <p class="mt-0.5 text-[11px] text-muted-foreground italic">
                    No teachers are currently available in the system.
                  </p>
                {:else}
                  <p class="text-[10px] text-muted-foreground">
                    Showing {availableTeachersFiltered.length} of {availableTeachers.length} system teachers.
                  </p>
                {/if}
              </div>

              <div
                class="rounded-lg border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground italic"
              >
                No instructor is currently assigned to this section.
              </div>
            {:else}
              <!-- TEACHER ALREADY ASSIGNED: Show assigned instructor with unassign action, and HIDE assign input -->
              <div class="flex flex-col gap-2">
                <h4 class="px-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Assigned Instructor
                </h4>
                {#if selectedSection.teachers[0]}
                  {@const teacher = selectedSection.teachers[0]}
                  <div class="flex items-center justify-between rounded-md border border-border bg-card p-4">
                    <div class="flex items-center gap-3">
                      <Avatar.Root class="h-10 w-10 border border-border shadow-xs">
                        <Avatar.Image src={teacher.avatarUrl} alt={teacher.name} />
                        <Avatar.Fallback class="bg-primary/5 text-sm font-bold text-primary">
                          {teacher.name.substring(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div class="flex flex-col">
                        <span class="text-sm leading-none font-semibold text-foreground">{teacher.name}</span>
                        <span class="mt-1.5 text-xs leading-none text-muted-foreground">{teacher.email}</span>
                        <Badge
                          variant="secondary"
                          class="mt-2 w-fit border-none bg-primary/10 px-1.5 py-0 text-[10px] font-bold tracking-wider text-primary uppercase"
                        >
                          Course Instructor
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      class="border-border text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
                      onclick={() => removeTeacher(teacher._id)}
                    >
                      <UserXIcon class="mr-1.5 h-3.5 w-3.5" />
                      Remove Instructor
                    </Button>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        <!-- B. Students (Enrollment) Tab -->
        {#if activeTab === 'students'}
          <div class="flex flex-col gap-4">
            <!-- Enroll Student Sub-section -->
            <div class="flex flex-col gap-3 rounded-md border border-border bg-muted/10 p-4">
              <h4 class="text-xs font-bold tracking-wider text-foreground uppercase">Enroll New Student</h4>

              <!-- Search Box for Available Students -->
              <div class="relative">
                <SearchIcon class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search available students by name or email..."
                  class="h-10 bg-card pl-9 text-xs"
                  bind:value={studentSearchQuery}
                />
              </div>

              <div class="flex gap-2">
                <select
                  class="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  bind:value={studentToEnrollId}
                >
                  <option value="">-- Choose Student --</option>
                  {#each availableStudentsFiltered as student (student._id)}
                    <option value={student._id}>{student.name} ({student.email})</option>
                  {/each}
                </select>
                <Button
                  onclick={enrollStudent}
                  disabled={!studentToEnrollId}
                  class="h-10 shrink-0 px-5 font-bold shadow-xs"
                >
                  <UserCheckIcon class="mr-1.5 h-4 w-4" />
                  Enroll
                </Button>
              </div>
              {#if availableStudents.length === 0}
                <p class="mt-0.5 text-[11px] text-muted-foreground italic">
                  All system students are currently enrolled in this section.
                </p>
              {:else}
                <p class="text-[10px] text-muted-foreground">
                  Showing {availableStudentsFiltered.length} of {availableStudents.length} unassigned students.
                </p>
              {/if}
            </div>

            <!-- Enrolled Students List -->
            <div class="flex flex-col gap-2">
              <h4 class="px-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Currently Enrolled Students
              </h4>
              {#if !selectedSection || selectedSection.students.length === 0}
                <div
                  class="rounded-lg border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground italic"
                >
                  No students are currently enrolled in this section.
                </div>
              {:else}
                <div
                  class="max-h-[300px] divide-y divide-border/40 overflow-y-auto rounded-md border border-border bg-card"
                >
                  {#each selectedSection.students as student (student?._id)}
                    {#if student}
                      <div class="flex items-center justify-between p-3">
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
            </div>
          </div>
        {/if}
      </div>
    </div>

    <Dialog.Footer class="border-t border-border/40 pt-4">
      <Button variant="outline" onclick={() => (membersDialogOpen = false)}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
