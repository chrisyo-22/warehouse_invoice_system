<script setup lang="ts">
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import { RouterView } from 'vue-router'; // Explicitly import RouterView if not automatically available
import AppHeader from './component/AppHeader.vue';

const store = useStore();
onMounted(() => {
  if (localStorage.getItem('token')) {
    store.dispatch('auth/fetchUser');
  }
});
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensures the layout takes at least the full viewport height */
  background-color: #f0f2f5; /* A light background for the overall app area */
}

.app-content {
  flex-grow: 1; /* Allows this area to take up remaining space */
  padding: 20px; /* Example padding, adjust as needed */
  overflow-y: auto; /* Add scroll to content area if it overflows */
  /* Additional styling for content area if needed */
}
</style>
