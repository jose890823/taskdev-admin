<script lang="ts" setup>
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    position="top-right"
    :duration="5000"
    rich-colors
    expand
    close-button
  />
</template>

<style>
/* Estilos base para el toaster */
.toaster {
  --width: 360px;
}
</style>
