<template>
  <Button variant="ghost" size="icon" @click="toggleTheme">
    <SunIcon v-if="isDark" class="size-4" />
    <MoonIcon v-else class="size-4" />
  </Button>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { SunIcon, MoonIcon } from 'lucide-vue-next'

const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
