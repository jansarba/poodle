<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { Button } from '$lib/components/ui/button';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  async function handleRegister() {
    loading = true;
    message = '';
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      message = error.message;
    } else {
      message = 'Check your email for the confirmation link!';
    }
    loading = false;
  }

  async function handleLogin() {
    loading = true;
    message = '';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      message = error.message;
    }
    // Po zalogowaniu SvelteKit powinien automatycznie odświeżyć dane
    loading = false;
  }
</script>

<div class="space-y-4">
  <h2 class="text-xl font-semibold">Authentication</h2>
  <div>
    <label for="email">Email</label>
    <input id="email" type="email" bind:value={email} class="..." />
  </div>
  <div>
    <label for="password">Password</label>
    <input id="password" type="password" bind:value={password} class="..." />
  </div>
  <div class="flex gap-4">
    <Button onclick={handleLogin} disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </Button>
    <Button onclick={handleRegister} disabled={loading} variant="secondary">
      {loading ? 'Registering...' : 'Register'}
    </Button>
  </div>
  {#if message}<p class="text-sm">{message}</p>{/if}
</div>