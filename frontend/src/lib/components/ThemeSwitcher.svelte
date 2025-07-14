<script lang="ts">
  import { theme } from '$lib/stores/themeStore';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import Sun from 'lucide-svelte/icons/sun';
  import Moon from 'lucide-svelte/icons/moon';
  import Laptop from 'lucide-svelte/icons/laptop';
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button variant="outline" size="icon">
      <Sun
        class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <Moon
        class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <span class="sr-only">Toggle theme</span>
    </Button>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content>
    <DropdownMenu.Item onclick={() => theme.set('light')}>
      <Sun class="mr-2 h-4 w-4" />
      Light
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => theme.set('dark')}>
      <Moon class="mr-2 h-4 w-4" />
      Dark
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => theme.set('system')}>
      <Laptop class="mr-2 h-4 w-4" />
      System
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>