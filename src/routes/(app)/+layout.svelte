<script lang="ts">
  import gsap from 'gsap';
  import { onMount } from 'svelte';

  import { goto, onNavigate } from '$app/navigation';

  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import ScreenShareManager from '$lib/components/screen-share-manager.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { loadSession, session } from '$lib/session';

  const { children } = $props();
  const currentSession = $derived($session);

  onMount(() => {
    loadSession();
    const unsub = session.subscribe((s) => {
      if (!s) goto('/login');
    });
    return unsub;
  });

  onNavigate((navigation) => {
    const path = navigation.to?.url?.pathname;
    const appPaths = [
      '/dashboard',
      '/activities',
      '/forum',
      '/problems',
      '/sections',
      '/settings',
      '/chat',
      '/sharescreen',
      '/users',
      '/admin',
    ];
    const isInternal = path && appPaths.some((p) => path === p || path.startsWith(p + '/'));
    if (!isInternal) return;

    const curtain = document.createElement('div');
    curtain.className = 'nav-curtain';

    const content = document.querySelector('[data-slot="sidebar-inset"]');
    if (content) {
      const rect = content.getBoundingClientRect();
      curtain.style.top = `${rect.top}px`;
      curtain.style.left = `${rect.left}px`;
      curtain.style.width = `${rect.width}px`;
      curtain.style.height = `${rect.height}px`;
    } else {
      curtain.style.inset = '0';
    }
    document.body.appendChild(curtain);

    gsap.set(curtain, { clipPath: 'inset(0 100% 0 0)' });

    return new Promise<void>((resolve) => {
      gsap.to(curtain, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.25,
        ease: 'power2.out',
        onComplete: async () => {
          resolve();

          await new Promise((r) => setTimeout(r, 50));
          await new Promise((r) => requestAnimationFrame(r));

          gsap.to(curtain, {
            clipPath: 'inset(0 0% 0 100%)',
            duration: 0.4,
            ease: 'power2.inOut',
            onComplete: () => {
              curtain.remove();
            },
          });
        },
      });
    });
  });
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <div class="flex flex-1 flex-col p-2">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>

{#if currentSession?.role === 'student'}
  <ScreenShareManager />
{/if}
