import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

register('en', () => import('./en.json'));
register('pl', () => import('./pl.json'));

init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
});