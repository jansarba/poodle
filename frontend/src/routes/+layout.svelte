<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { user, initializeAuth, logout } from '$lib/stores/authStore';
  import { theme } from '$lib/stores/themeStore';
  import { _, locale, waitLocale } from 'svelte-i18n';
  
  import '$lib/translations'; 
  import '../app.css';

  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import LangSwitcher from '$lib/components/LangSwitcher.svelte';

  let isAppReady = false;

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

  $: if (browser) {
    const isDark =
      $theme === 'dark' ||
      ($theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }
</script>

<!-- Używamy flagi `isAppReady`, aby uniknąć migotania nieprzetłumaczonej treści -->
{#if !isAppReady}
  <div class="min-h-screen flex items-center justify-center bg-background text-foreground">
    <p class="text-muted-foreground">Initializing...</p>
  </div>
{:else}
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <!-- 1. Zmieniamy layout `nav` na `justify-between` -->
      <nav class="container mx-auto h-14 px-4 flex justify-between items-center gap-4">
        
        <!-- 2. Dodajemy minimalistyczny link "Home" po lewej stronie -->
        <a href="/" class="text-lg font-semibold tracking-tight transition-colors hover:text-primary">
          {$_('nav.home')}
        </a>
        
        <!-- 3. Grupujemy wszystkie elementy prawej strony w jednym divie -->
        <div class="flex items-center gap-4">
          {#if $user}
            <a href="/profile" class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {$_('nav.profile')}
            </a>
            <span class="text-sm text-muted-foreground hidden sm:inline">|</span>
            <span class="text-sm font-semibold hidden sm:inline">{$user.email}</span>
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

          <!-- 4. Przełączniki są teraz globalne, w nagłówku -->
          <div class="h-6 w-px bg-border hidden sm:block"></div>
          <LangSwitcher />
          <ThemeSwitcher />
        </div>
      </nav>
    </header>

    <main>
      <slot />
    </main>
  </div>
{/if}