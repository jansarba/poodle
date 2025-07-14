<script lang="ts">
  import { locale } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let isSwitching = false;

  async function setLocale(lang: 'en' | 'pl') {
    if (isSwitching) return;
    isSwitching = true;
    await locale.set(lang);
    isSwitching = false;
  }
</script>

<div class="flex items-center space-x-2 text-sm">
  <button
    on:click={() => setLocale('en')}
    disabled={isSwitching}
    class:font-bold={$locale?.startsWith('en')}
    class="text-foreground/60 hover:text-foreground/80 disabled:opacity-50 transition-colors"
    aria-label="Switch to English"
  >
    EN
  </button>
  <span class="text-border">|</span>
  <button
    on:click={() => setLocale('pl')}
    disabled={isSwitching}
    class:font-bold={$locale?.startsWith('pl')}
    class="text-foreground/60 hover:text-foreground/80 disabled:opacity-50 transition-colors"
    aria-label="Przełącz na polski"
  >
    PL
  </button>
</div>