<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { user, isLoadingUser } from '$lib/stores/authStore';
  import { api } from '$lib/utils/api';
  import { _ } from 'svelte-i18n';

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';

  type Profile = {
    full_name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  
  let profile: Profile | null = null;
  let loading = true;
  let isUpdating = false;
  let isUploading = false;
  let errorMessage = '';
  let successMessage = '';

  let full_nameInput = '';
  let avatarFile: FileList;

  onMount(() => {
    const unsubscribe = isLoadingUser.subscribe(async (loadingState) => {
      if (loadingState === false) {
        const currentUser = get(user);
        if (!currentUser) {
          goto('/login', { replaceState: true });
          return;
        }
        
        if (!profile) {
          try {
            const data = await api('users/me');
            profile = data;
            full_nameInput = profile?.full_name ?? '';
          } catch (err: any) {
            errorMessage = err.message || $_('profile_page.error_load');
          } finally {
            loading = false;
          }
        }
      }
    });
    return () => unsubscribe();
  });

  async function handleUpdateProfile() {
    isUpdating = true;
    errorMessage = '';
    successMessage = '';
    try {
      const updatedProfile = await api('users/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: full_nameInput }),
      });
      profile = updatedProfile;
      successMessage = $_('profile_page.success_update');
    } catch (err: any) {
      errorMessage = err.message || $_('profile_page.error_update');
    } finally {
      isUpdating = false;
    }
  }

  async function handleUploadAvatar() {
    if (!avatarFile || avatarFile.length === 0) {
      errorMessage = $_('profile_page.error_select_file');
      return;
    }
    
    isUploading = true;
    errorMessage = '';
    successMessage = '';
    const formData = new FormData();
    formData.append('avatar', avatarFile[0]);

    try {
      const updatedProfile = await api('users/me/avatar', {
        method: 'POST',
        body: formData,
      });
      profile = updatedProfile;
      // Resetujemy pole input po udanym uploadzie
      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      successMessage = $_('profile_page.success_update');
    } catch (err: any) {
      errorMessage = err.message || $_('profile_page.error_update');
    } finally {
      isUploading = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto p-4 md:p-8">
  <h1 class="text-3xl font-bold mb-8">{$_('profile_page.your_profile')}</h1>

  {#if loading}
    <p class="text-muted-foreground">{$_('profile_page.loading')}</p>
  {:else if errorMessage && !profile}
    <p class="text-destructive">{errorMessage}</p>
  {:else if profile}
    <div class="space-y-12">
      <!-- Sekcja awatara - widoczna tylko z Supabase -->
      {#if useSupabase}
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b pb-2">{$_('profile_page.profile_picture')}</h2>
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <img
              src={profile.avatarUrl ?? `https://api.dicebear.com/7.x/micah/svg?seed=${profile.email}`}
              alt="User avatar"
              class="h-24 w-24 rounded-full object-cover bg-muted"
            />
            <div class="flex-1 w-full space-y-2">
              <Label for="avatar-upload">Change Avatar</Label>
              <Input 
                id="avatar-upload"
                type="file" 
                accept="image/png, image/jpeg" 
                bind:files={avatarFile} 
                disabled={isUploading}
              />
              <Button onclick={handleUploadAvatar} disabled={isUploading} class="w-full sm:w-auto">
                {#if isUploading}
                  {$_('profile_page.uploading_avatar')}
                {:else}
                  {$_('profile_page.upload_button')}
                {/if}
              </Button>
            </div>
          </div>
        </section>
      {/if}

      <!-- Sekcja danych profilu -->
      <section class="space-y-4">
        <h2 class="text-xl font-semibold border-b pb-2">Profile Details</h2>
        <form class="space-y-4" on:submit|preventDefault={handleUpdateProfile}>
          <div class="grid w-full items-center gap-1.5">
            <Label for="email">{$_('profile_page.email_label')}</Label>
            <Input 
              id="email"
              type="email"
              value={profile.email}
              disabled
              class="bg-muted"
            />
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="full_name">{$_('profile_page.full_name_label')}</Label>
            <Input
              id="full_name"
              type="text"
              bind:value={full_nameInput}
              disabled={isUpdating}
            />
          </div>
          <Button type="submit" disabled={isUpdating} class="w-full sm:w-auto">
            {#if isUpdating}
              {$_('profile_page.updating_profile')}
            {:else}
              {$_('profile_page.update_button')}
            {/if}
          </Button>
        </form>
      </section>

      <!-- Komunikaty zwrotne -->
      {#if successMessage}
        <p class="text-center text-sm text-green-600 dark:text-green-500 transition-opacity duration-300">
          {successMessage}
        </p>
      {/if}
      {#if errorMessage}
        <p class="text-center text-sm text-destructive transition-opacity duration-300">
          {errorMessage}
        </p>
      {/if}
    </div>
  {/if}
</div>