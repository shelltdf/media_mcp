<script setup lang="ts">
import MainFrame from "@/components/layout/MainFrame.vue";
import { provideLog } from "@/composables/useLog";

provideLog();
</script>

<template>
  <MainFrame />
</template>
