<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { _, locale, format as formatMessage } from 'svelte-i18n';
  import { derived, get } from 'svelte/store';
  import type { Poll } from '$lib/types';
  import LangSwitcher from '$lib/components/LangSwitcher.svelte';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { format, type Locale } from 'date-fns';
  import { pl, enUS } from 'date-fns/locale';
  import { cn } from '$lib/utils';
  import { api } from '$lib/utils/api';
  import { user } from '$lib/stores/authStore';

  const dateFnsLocaleStore = derived(locale, ($l) => ($l?.startsWith('pl') ? pl : enUS));
  let dateFnsLocale: Locale;
  dateFnsLocaleStore.subscribe((value) => (dateFnsLocale = value));

  let poll: Poll | null = null;
  let isLoading = true;
  let error = '';

  let voterName = '';
  let selectedTimeSlots: string[] = [];
  let isSubmitting = false;
  let isCopied = false;

  // Reaktywna zmienna sprawdzająca, czy użytkownik jest zalogowany.
  $: isLoggedIn = !!$user;

  $: totalVotes = poll?.votes.length ?? 0;

  $: bestSlots = (() => {
    if (!poll || totalVotes === 0) return [];
    const voteCounts = poll.timeSlots.map((slot) => ({ slot, count: getVoteCount(slot) }));
    const maxVotes = Math.max(...voteCounts.map((vc) => vc.count));
    if (maxVotes === 0) return [];
    return voteCounts.filter((vc) => vc.count === maxVotes).map((vc) => vc.slot);
  })();

  function displayName(vote: any) {
  return vote.user?.full_name?.trim()
    || vote.voterName?.trim()
    || vote.user?.email;
  }

  function avatarUrl(vote: any) {
    return vote.user?.avatarUrl
      ? `${vote.user.avatarUrl}`          
      : '/images/default-avatar.svg';     
  }

  function getVoteCount(slot: string): number {
    if (!poll?.votes) return 0;
    return poll.votes.filter((vote) => vote.selectedTimeSlots.includes(slot)).length;
  }

  function getVotePercentage(slot: string): number {
    const bestSlotVoteCount = bestSlots.length > 0 ? getVoteCount(bestSlots[0]) : 0;
    if (bestSlotVoteCount === 0) return 0;
    const currentSlotVoteCount = getVoteCount(slot);
    return Math.round((currentSlotVoteCount / bestSlotVoteCount) * 100);
  }

  function copyLink() {
    if (isCopied) return;
    navigator.clipboard.writeText(window.location.href);
    isCopied = true;
    setTimeout(() => {
      isCopied = false;
    }, 2500);
  }

  async function fetchPoll() {
    const pollId = $page.params.id;
    isLoading = true;
    error = '';
    try {
      // Używamy scentralizowanego helpera `api`
      const pollData = await api(`polls/${pollId}`);

      // Przetwarzamy daty w głosach, aby były obiektami Date
      if (pollData.votes) {
        pollData.votes = pollData.votes.map((vote: any) => ({
          ...vote,
          votedAt: new Date(vote.votedAt)
        }));
      }
      poll = pollData as Poll;
    } catch (e: any) {
      error = e.message || 'An unknown error occurred while loading the poll.';
      console.error('fetchPoll() caught an error:', e);
    } finally {
      isLoading = false;
    }
  }

  async function handleVoteSubmit() {
    const pollId = $page.params.id;
    
    if (!isLoggedIn && !voterName.trim()) {
      alert($_('poll_page.validation_alert_name'));
      return;
    }
    if (selectedTimeSlots.length === 0) {
      alert($_('poll_page.validation_alert_slots'));
      return;
    }
    
    isSubmitting = true;
    error = '';

    // Dane do wysłania: imię jest brane z formularza (dla anonimowych)
    // lub z danych zalogowanego użytkownika. Backend i tak użyje ID z tokenu.
    const voteData = {
      voterName: isLoggedIn ? (get(user)?.email ?? 'Authenticated User') : voterName,
      selectedTimeSlots
    };

    try {
      // Helper `api` automatycznie dołączy token, jeśli użytkownik jest zalogowany.
      // Pasuje to do strategii "passthrough" na backendzie.
      await api(`polls/${pollId}/votes`, {
        method: 'POST',
        body: JSON.stringify(voteData)
      });

      // Resetowanie formularza i odświeżenie danych
      voterName = '';
      selectedTimeSlots = [];
      await fetchPoll();
    } catch (e: any) {
      error = e.message || 'An unknown error occurred while submitting the vote.';
      console.error('handleVoteSubmit() caught an error:', e);
    } finally {
      isSubmitting = false;
    }
  }

  onMount(fetchPoll);
</script>

<main class="font-sans bg-background text-foreground min-h-screen p-4 md:p-8">
  <div class="max-w-4xl mx-auto">
    <!-- Top bar -->
    <div class="flex justify-between items-center mb-8">
      <Button href="/" variant="link" class="text-primary hover:text-primary/90 px-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        {$_('common.back_to_polls')}
      </Button>
      <div class="flex items-center space-x-2">
        <Button
          onclick={copyLink}
          variant="outline"
          size="sm"
          class={cn(
            'transition-colors',
            isCopied && 'border-green-500/50 text-green-600 hover:bg-green-500/10'
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
            <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" />
          </svg>
          {isCopied ? $_('poll_page.copied') : $_('poll_page.copy_link')}
        </Button>
      </div>
    </div>

    {#if isLoading}
      <p class="text-center text-muted-foreground text-lg">{$_('common.loading')}</p>
    {:else if error && !poll}
      <div class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md" role="alert">
        <strong class="font-bold">{$_('common.error')}:</strong>
        <span class="block sm:inline">{error}</span>
      </div>
    {:else if poll}
      <!-- Header / hero -->
      <header class="mb-8 rounded-lg shadow-md overflow-hidden">
        {#if poll.imageUrl}
          <!-- hero image -->
          <figure class="relative w-full h-64 md:h-72 lg:h-80">
            <img src={poll.imageUrl} alt={poll.title} class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-transparent"></div>
            <figcaption class="absolute inset-x-0 bottom-0 p-6 text-center text-white drop-shadow-lg">
              <h1 class="text-3xl md:text-4xl font-bold tracking-tight">{poll.title}</h1>
              {#if poll.description}
                <p class="mt-1 text-sm md:text-base opacity-90">{poll.description}</p>
              {/if}
            </figcaption>
          </figure>
        {:else}
          <!-- fallback header without image -->
          <div class="bg-card p-6 text-center rounded-lg">
            <h1 class="text-4xl font-bold text-card-foreground">{poll.title}</h1>
            {#if poll.description}
              <p class="text-muted-foreground mt-2">{poll.description}</p>
            {/if}
          </div>
        {/if}
      </header>

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <!-- Voting form -->
        <section class="lg:col-span-2 bg-card p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-semibold text-card-foreground mb-4">
            {$_('poll_page.cast_your_vote')}
          </h2>
          <form on:submit|preventDefault={handleVoteSubmit} class="space-y-6">
            <!-- Pole "Twoje imię" jest widoczne tylko dla niezalogowanych użytkowników -->
            {#if !isLoggedIn}
              <div>
                <label for="name" class="block text-sm font-medium text-foreground">
                  {$_('poll_page.your_name')}
                </label>
                <input
                  id="name"
                  type="text"
                  bind:value={voterName}
                  required
                  class="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={$_('poll_page.voter_name_placeholder')}
                />
              </div>
            {/if}

            <fieldset>
              <legend class="text-sm font-medium text-foreground mb-2">
                {$_('poll_page.available_time_slots')}
              </legend>
              <div class="space-y-2">
                {#each poll.timeSlots as slot (slot)}
                  <label class="flex items-center p-3 rounded-md border border-border hover:bg-accent cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      bind:group={selectedTimeSlots}
                      value={slot}
                      class="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                    <span class="ml-3 text-sm text-foreground">
                      {format(new Date(slot), 'PPPP', { locale: dateFnsLocale })}
                    </span>
                  </label>
                {/each}
              </div>
            </fieldset>

            {#if error}<p class="text-sm text-destructive mt-2">{error}</p>{/if}

            <Button type="submit" disabled={isSubmitting} class="w-full">
              {isSubmitting ? $_('poll_page.submitting') : $_('poll_page.submit_vote')}
            </Button>
          </form>
        </section>

        <!-- Results -->
        <section class="lg:col-span-3 bg-card p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-semibold text-card-foreground mb-4">
            {$_('poll_page.results')}
          </h2>

          {#if totalVotes > 0}
            <div class="space-y-4">
              <!-- Time slots list -->
              <ul class="space-y-3">
                {#each poll.timeSlots as slot (slot)}
                  {@const count = getVoteCount(slot)}
                  {@const isBest = bestSlots.includes(slot)}
                  <li class="p-3 rounded-md border transition-colors {isBest ? 'bg-accent border-primary/50' : 'border-transparent'}">
                    <div class="flex justify-between items-center mb-1">
                      <span class:text-primary={isBest} class:font-bold={isBest} class="text-sm text-foreground">
                        {format(new Date(slot), 'PPPP', { locale: dateFnsLocale })}
                      </span>
                      <span class:text-primary={isBest} class="text-sm font-semibold text-muted-foreground">
                        {$formatMessage('poll_page.votes_plural', { values: { count } })}
                      </span>
                    </div>
                    <div class="w-full bg-muted rounded-full h-2.5">
                      <div
                        class="h-2.5 rounded-full transition-all duration-500 {isBest ? 'bg-primary' : 'bg-secondary'}"
                        style={`width: ${getVotePercentage(slot)}%`}
                      ></div>
                    </div>
                  </li>
                {/each}
              </ul>

              <hr class="my-6 border-border" />

              <!-- Participants list -->
              <h3 class="text-lg font-semibold text-card-foreground">
                {$_('poll_page.participants_header', { values: { totalVotes } })}
              </h3>

              <ul class="space-y-2 max-h-48 overflow-y-auto">
                {#each poll.votes as vote (vote.id)}
                  <li class="text-sm flex items-center justify-between">
                    <!-- lewa część: awatar + nazwa -->
                    <div class="flex items-center space-x-2">
                      <img
                        src={avatarUrl(vote)}
                        alt="avatar"
                        class="w-6 h-6 rounded-full object-cover border border-border" />

                      <span class="text-foreground">{displayName(vote)}</span>
                    </div>

                    <!-- prawa część: data głosu -->
                    {#if vote.votedAt}
                      <span class="text-xs text-muted-foreground">
                        {format(vote.votedAt, 'Pp', { locale: dateFnsLocale })}
                      </span>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          {:else}
            <p class="text-center text-muted-foreground italic py-8">
              {$_('poll_page.no_votes')}
            </p>
          {/if}
        </section>
      </div>
    {/if}
  </div>
</main>