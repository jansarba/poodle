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

  type VotedPoll = {
    id: string;
    pollId: string;
    selectedTimeSlots: string[];
    votedAt: string;
    poll: {
      id: string;
      title: string;
      description: string | null;
    };
  };

  let profile: Profile | null = null;
  let votedPolls: VotedPoll[] = [];
  let loading = true;
  let isUpdating = false;
  let isUploading = false;
  let errorMessage = '';
  let successMessage = '';

  let full_nameInput = '';
  let avatarFile: FileList;
  let avatarFileName = '';

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
            const [data, votes] = await Promise.all([
              api('users/me'),
              api('users/me/votes'),
            ]);
            profile = data;
            votedPolls = votes;
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

  function syncAuthStore() {
    if (profile) {
      const currentUser = get(user);
      if (currentUser) {
        user.set({
          ...currentUser,
          full_name: profile.full_name,
          avatarUrl: profile.avatarUrl,
        });
      }
    }
  }

  function triggerFileInput() {
    document.getElementById('avatar-upload')?.click();
  }

  function onFileSelected() {
    if (avatarFile && avatarFile.length > 0) {
      avatarFileName = avatarFile[0].name;
    }
  }

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
      syncAuthStore();
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
      syncAuthStore();
      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      avatarFileName = '';

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
      <!-- Avatar display (no upload controls) -->
      <section class="flex items-center gap-4">
        <img
          src={profile.avatarUrl ?? '/images/default-avatar.svg'}
          alt="User avatar"
          class="h-20 w-20 rounded-full object-cover bg-muted border border-border"
        />
        <div>
          <p class="text-lg font-semibold">{profile.full_name?.trim() || profile.email}</p>
          {#if profile.full_name?.trim()}
            <p class="text-sm text-muted-foreground">{profile.email}</p>
          {/if}
        </div>
      </section>

      <!-- Your events section -->
      <section class="space-y-4">
        <h2 class="text-xl font-semibold border-b pb-2">{$_('profile_page.voted_events')}</h2>
        {#if votedPolls.length > 0}
          <ul class="space-y-2">
            {#each votedPolls as vote (vote.id)}
              <li>
                <a
                  href="/poll/{vote.poll.id}"
                  class="block p-3 rounded-md border border-border hover:bg-accent transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-foreground">{vote.poll.title}</span>
                    <span class="text-xs text-muted-foreground">
                      {new Date(vote.votedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {#if vote.poll.description}
                    <p class="text-sm text-muted-foreground mt-1 truncate">{vote.poll.description}</p>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-muted-foreground italic">{$_('profile_page.no_voted_events')}</p>
        {/if}
      </section>

      <!-- Profile details section -->
      <section class="space-y-4">
        <h2 class="text-xl font-semibold border-b pb-2">{$_('profile_page.profile_details')}</h2>
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

      <!-- Profile picture upload section - below details, only with Supabase -->
      {#if useSupabase}
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b pb-2">{$_('profile_page.profile_picture')}</h2>
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <img
              src={profile.avatarUrl ?? '/images/default-avatar.svg'}
              alt="User avatar"
              class="h-24 w-24 rounded-full object-cover bg-muted"
            />
            <div class="flex-1 w-full space-y-3">
              <input
                id="avatar-upload"
                type="file"
                accept="image/png, image/jpeg"
                bind:files={avatarFile}
                on:change={onFileSelected}
                class="hidden"
                disabled={isUploading}
              />
              <div class="flex items-center gap-3">
                <Button type="button" variant="outline" onclick={triggerFileInput} disabled={isUploading} class="shrink-0">
                  {$_('profile_page.choose_file')}
                </Button>
                {#if avatarFileName}
                  <span class="text-sm text-muted-foreground truncate">{avatarFileName}</span>
                {/if}
              </div>
              <Button onclick={handleUploadAvatar} disabled={isUploading || !avatarFileName} class="w-full sm:w-auto">
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

      <!-- Feedback messages -->
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
