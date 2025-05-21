<script setup lang="ts">
import { onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
onMounted(() => {
  if (localStorage.getItem('token')) {
    store.dispatch('auth/fetchUser');
  }
});
</script>

<template>
  <RouterView />
</template>
