<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { user, initializeAuth, logout } from '$lib/stores/authStore';
  import { theme } from '$lib/stores/themeStore';
  import { _, locale, waitLocale } from 'svelte-i18n';

  import '$lib/translations';
  import '../app.css';

  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import LangSwitcher from '$lib/components/LangSwitcher.svelte';

  // blocks rendering until locale + auth are both resolved
  let isAppReady = false;

  // redirect unauthenticated users to /login
  $: if (isAppReady && browser && !$user && $page.url.pathname !== '/login') {
    goto('/login', { replaceState: true });
  }

  onMount(async () => {
    if (browser) {
      try {
        await Promise.all([
          waitLocale(),
          initializeAuth()
        ]);
      } catch (error) {
        console.error('Critical initialization error in +layout.svelte:', error);
      } finally {
        isAppReady = true;
      }
    }
  });

  // sync dark/light mode with system preference
  $: if (browser) {
    const isDark =
      $theme === 'dark' ||
      ($theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }
</script>

{#if !isAppReady}
  <div class="min-h-screen flex items-center justify-center bg-background text-foreground">
    <p class="text-muted-foreground">Initializing...</p>
  </div>
{:else}
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav class="container mx-auto h-14 px-4 flex justify-between items-center gap-4">
        <a href="/" class="text-lg font-semibold tracking-tight transition-colors hover:text-primary">
          {$_('nav.home')}
        </a>

        <div class="flex items-center gap-4">
          {#if $user}
            <a href="/profile" class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {$_('nav.profile')}
            </a>
            <span class="text-sm text-muted-foreground hidden sm:inline">|</span>
            <div class="hidden sm:flex items-center gap-2">
              <img
                src={$user.avatarUrl ?? '/images/default-avatar.svg'}
                alt="avatar"
                class="w-6 h-6 rounded-full object-cover border border-border"
              />
              <span class="text-sm font-semibold">{$user.full_name?.trim() || $user.email}</span>
            </div>
            <button
              on:click={logout}
              class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {$_('nav.logout')}
            </button>
          {:else}
            <a href="/login" class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {$_('nav.login_register')}
            </a>
          {/if}

          <div class="h-6 w-px bg-border hidden sm:block"></div>
          <LangSwitcher />
          <ThemeSwitcher />
        </div>
      </nav>
    </header>

    <main>
      {#if $user || $page.url.pathname === '/login'}
        <slot />
      {/if}
    </main>
  </div>
{/if}
