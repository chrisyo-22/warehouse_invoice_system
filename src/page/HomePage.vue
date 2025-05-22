<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import Dashboard from './Dashboard.vue';

const activeIndex = ref('1');
const router = useRouter();
const store = useStore();

const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const user = computed(() => store.getters['auth/user']);

const navigateTo = (path: string) => {
  router.push(path);
};

const handleLogout = async () => {
  try {
    await store.dispatch('auth/logout');
    router.push('/');
    ElMessage.success('Logged out successfully');
  } catch (error) {
    ElMessage.error('Failed to logout');
  }
};
</script>

<template>
  <div class="home-page">
    <!-- Header and el-menu removed -->
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  /* height: 100vh; */ /* This might conflict with App.vue's layout, let App.vue handle min-height */
  flex-grow: 1; /* Allow home-page to grow within App.vue's app-content */
  overflow-y: auto; /* If home-page itself needs to scroll, though content will scroll */
}

/* Removed styles for .header, .user-info, .company-name, .el-menu-demo */

.content {
  flex: 1; /* This is good, content takes available space */
  overflow-y: auto; /* This is good for content scrolling */
  padding: 20px; /* Keep padding for the content area */
  /* background-color: #fff; */ /* Optional: if a distinct background for content area is desired */
}
</style>