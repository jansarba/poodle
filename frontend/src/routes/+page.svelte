<script lang="ts">
  import { onMount } from 'svelte';
  import { _, locale } from 'svelte-i18n';
  import { derived } from 'svelte/store';
  import type { Poll } from '$lib/types';
  import { user } from '$lib/stores/authStore';
  import { api } from '$lib/utils/api';
  import { cn } from '$lib/utils';
  import { format, type Locale } from 'date-fns';
  import { pl, enUS } from 'date-fns/locale';
  import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';

  import { Button } from '$lib/components/ui/button';
  import { Calendar } from '$lib/components/ui/calendar';
  import * as Popover from '$lib/components/ui/popover';
  import CalendarIcon from 'lucide-svelte/icons/calendar';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const dateFnsLocaleStore = derived(locale, ($l) => ($l?.startsWith('pl') ? pl : enUS));
  let dateFnsLocale: Locale;
  dateFnsLocaleStore.subscribe((value) => (dateFnsLocale = value));

  let polls: Poll[] = [];
  let title = '';
  let description = '';
  let selectedDates: DateValue[] = [];

  let isLoading = true;
  let isSubmitting = false;
  let error = '';

  // Formularz tworzenia ankiety jest widoczny tylko, gdy użytkownik jest zalogowany.
  $: showCreateForm = !!$user;

  $: dateRangeLabel = (() => {
    if (selectedDates.length === 0) return $_('home.select_dates');
    if (selectedDates.length === 1) {
      return format(selectedDates[0].toDate(getLocalTimeZone()), 'PPP', { locale: dateFnsLocale });
    }
    const sorted = [...selectedDates].sort((a, b) => a.compare(b));
    const start = format(sorted[0].toDate(getLocalTimeZone()), 'PPP', { locale: dateFnsLocale });
    const end = format(sorted[sorted.length - 1].toDate(getLocalTimeZone()), 'PPP', {
      locale: dateFnsLocale
    });
    return `${start} – ${end} (${sorted.length} ${$_('common.days')})`;
  })();

  async function fetchPolls() {
    isLoading = true;
    error = '';
    try {
      polls = await api('polls');
    } catch (e: any) {
      error = e.message || 'Failed to load existing polls.';
      polls = [];
    } finally {
      isLoading = false;
    }
  }

  async function createPoll() {
    if (!title) {
      error = $_('errors.title_required');
      return;
    }
    if (selectedDates.length < 1) {
      error = $_('errors.select_at_least_one_date');
      return;
    }

    isSubmitting = true;
    error = '';

    const pollData = {
      title,
      description,
      timeSlots: selectedDates.sort((a, b) => a.compare(b)).map((d) => d.toString())
    };

    try {
      await api('polls', {
        method: 'POST',
        body: JSON.stringify(pollData)
      });

      title = '';
      description = '';
      selectedDates = [];
      
      await fetchPolls();
    } catch (e: any) {
      error = e.message || 'An unknown error occurred while creating the poll.';
    } finally {
      isSubmitting = false;
    }
  }

  onMount(fetchPolls);
</script>

<main class="container mx-auto max-w-3xl p-4 md:p-8">
  
  <header class="text-center mb-12">
    <h1 class="text-4xl font-bold tracking-tight">{$_('home.title')}</h1>
    <p class="text-muted-foreground mt-2">{$_('home.subtitle')}</p>
  </header>

  <!-- Sekcja tworzenia ankiety jest renderowana warunkowo -->
  {#if showCreateForm}
    <section class="bg-card text-card-foreground p-6 rounded-lg shadow-md mb-12">
      <h2 class="text-2xl font-semibold mb-6 border-b pb-2">{$_('home.create_poll_header')}</h2>
      <form on:submit|preventDefault={createPoll} class="space-y-4">
        <div class="grid w-full items-center gap-1.5">
          <Label for="title">{$_('home.form_title')}</Label>
          <Input
            id="title"
            type="text"
            bind:value={title}
            required
            placeholder={$_('home.title_placeholder')}
            disabled={isSubmitting}
          />
        </div>

        <div class="grid w-full items-center gap-1.5">
          <Label for="description">{$_('home.form_description')}</Label>
          <Input
            id="description"
            type="text"
            bind:value={description}
            placeholder={$_('home.description_placeholder')}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label class="text-sm font-medium">{$_('home.select_dates')}</Label>
          <Popover.Root>
            <Popover.Trigger
              class={cn(
                'w-full justify-start text-left font-normal flex items-center mt-1.5',
                'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                'h-10 px-3 py-2 rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selectedDates.length === 0 && 'text-muted-foreground'
              )}
              disabled={isSubmitting}
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              {dateRangeLabel}
            </Popover.Trigger>
            <Popover.Content class="w-auto p-0" side="top">
              <Calendar
                type="multiple"
                bind:value={selectedDates}
                minValue={today(getLocalTimeZone())}
                locale={$locale ?? 'en-US'}
              />
            </Popover.Content>
          </Popover.Root>
        </div>

        {#if error}
          <p class="text-sm text-destructive">{error}</p>
        {/if}

        <Button type="submit" disabled={isSubmitting} class="w-full">
          {isSubmitting ? $_('common.loading') : $_('home.create_poll_header')}
        </Button>
      </form>
    </section>
  {/if}

  <section>
    <h2 class="text-2xl font-semibold mb-4">{$_('home.existing_polls_header')}</h2>
    {#if isLoading}
      <p class="text-center text-muted-foreground">{$_('common.loading')}</p>
    {:else if polls.length === 0}
      <div class="text-center text-muted-foreground bg-card p-8 rounded-lg shadow-md">
        <p>{$_('home.no_polls')}</p>
        {#if !showCreateForm}
          <a href="/login" class="mt-4 inline-block">
            <Button variant="link">Login to create a poll</Button>
          </a>
        {/if}
      </div>
    {:else}
      <ul class="space-y-4">
        {#each polls as poll (poll.id)}
          <a
            href="/poll/{poll.id}"
            class="block bg-card text-card-foreground p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out"
          >
            <strong class="text-lg">{poll.title}</strong>
            {#if poll.description}
              <p class="mt-1 text-sm text-muted-foreground">{poll.description}</p>
            {/if}
            <div class="mt-2 text-xs text-muted-foreground">
              {$_('home.created_on')}: {format(new Date(poll.createdAt), 'PPP', {
                locale: dateFnsLocale
              })}
            </div>
          </a>
        {/each}
      </ul>
    {/if}
  </section>
</main>