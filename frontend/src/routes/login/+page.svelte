<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/authStore';
  import { supabase } from '$lib/supabaseClient';
  import { api } from '$lib/utils/api';
  import { _ } from 'svelte-i18n';

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';

  let email = '';
  let password = '';
  let loading = false;
  let errorMessage = '';
  let successMessage = '';

  // Sprawdzamy, czy użytkownik jest już zalogowany. Jeśli tak, od razu
  // przekierowujemy go na stronę główną, aby nie widział formularza logowania.
  onMount(() => {
    const unsubscribe = user.subscribe(currentUser => {
      if (currentUser) {
        goto('/', { replaceState: true });
      }
    });
    return unsubscribe;
  });

  async function handleAuth(action: 'login' | 'register') {
    loading = true;
    errorMessage = '';
    successMessage = '';
    
    // Podstawowa walidacja po stronie klienta
    if (!email || !password) {
      errorMessage = "Email and password cannot be empty.";
      loading = false;
      return;
    }
    
    try {
      if (useSupabase) {
        // --- LOGIKA SUPABASE ---
        const response = action === 'login'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
        
        if (response.error) {
          throw response.error;
        }

        if (action === 'register') {
          if (response.data.user?.identities?.length === 0) {
            errorMessage = $_('login_page.user_already_exists');
            return;
          }
          successMessage = $_('login_page.register_success_supabase');
        }
        // Przekierowanie po udanym logowaniu nastąpi automatycznie przez listener w authStore.
      } else {
        // --- LOGIKA LOKALNA ---
        const endpoint = action === 'login' ? 'auth/login' : 'auth/register';
        const { token } = await api(endpoint, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        
        localStorage.setItem('token', token);
        const profile = await api('auth/me');
        user.set(profile);
        
        goto('/', { replaceState: true });
      }
    } catch (err: any) {
      errorMessage = err.message || $_('login_page.unexpected_error');
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)]">
  <div class="w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-lg">
    <div class="text-center">
      <h1 class="text-3xl font-bold">{$_('login_page.welcome')}</h1>
      <p class="text-muted-foreground">{$_('login_page.subtitle')}</p>
    </div>
    
    <!-- `on:submit` obsługuje zarówno kliknięcie przycisku type="submit", jak i naciśnięcie Enter -->
    <form class="space-y-4" on:submit|preventDefault={() => handleAuth('login')}>
      <div class="grid w-full items-center gap-1.5">
        <Label for="email">{$_('login_page.email_label')}</Label>
        <Input 
          type="email" 
          id="email" 
          placeholder={$_('login_page.email_placeholder')}
          bind:value={email}
          disabled={loading}
          autocomplete="username"
        />
      </div>
      <div class="grid w-full items-center gap-1.5">
        <Label for="password">{$_('login_page.password_label')}</Label>
        <Input 
          type="password" 
          id="password" 
          placeholder={$_('login_page.password_placeholder')}
          bind:value={password}
          disabled={loading}
          autocomplete="current-password"
        />
      </div>

      <!-- Komunikat o sukcesie (np. po rejestracji w Supabase) -->
      {#if successMessage && !errorMessage}
        <p class="text-center text-sm text-green-600 dark:text-green-500">
          {successMessage}
        </p>
      {/if}

      <!-- Komunikat o błędzie -->
      {#if errorMessage}
        <p class="text-center text-sm text-destructive">
          {errorMessage}
        </p>
      {/if}

      <div class="flex flex-col gap-4 pt-2">
        <!-- Przycisk logowania ma `type="submit"`, co pozwala na naturalne przesyłanie formularza -->
        <Button type="submit" disabled={loading} class="w-full">
          {loading ? $_('login_page.logging_in') : $_('login_page.login_button')}
        </Button>
        <!-- Przycisk rejestracji ma `type="button"`, aby NIE przesyłał formularza, tylko wywołał swoją akcję -->
        <Button type="button" onclick={() => handleAuth('register')} disabled={loading} variant="secondary" class="w-full">
          {loading ? $_('login_page.registering') : $_('login_page.register_button')}
        </Button>
      </div>
    </form>
  </div>
</div>