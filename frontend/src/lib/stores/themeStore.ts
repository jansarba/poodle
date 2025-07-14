import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

const initialTheme: Theme = (browser && localStorage.getItem('theme') as Theme) || 'system';

export const theme = writable<Theme>(initialTheme);

theme.subscribe((value) => {
  if (browser) {
    localStorage.setItem('theme', value);
  }
});