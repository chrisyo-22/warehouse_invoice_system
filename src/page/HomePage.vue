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
    <div class="header">
      <h1>Welcome to Jinjin Food Ordering App! 🦕</h1>
      <div v-if="isAuthenticated" class="user-info">
        <span class="company-name">{{ user?.company_name }}</span>
        <el-button type="danger" @click="handleLogout" size="small">
          Logout
        </el-button>
      </div>
    </div>
    
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
    >
      <el-menu-item index="1" @click="navigateTo('/')">Dashboard</el-menu-item>
      <el-menu-item index="2" @click="navigateTo('/order-today')">Order Today</el-menu-item>
      <el-menu-item index="3" @click="navigateTo('/past-orders')">Past Orders</el-menu-item>
    </el-menu>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #f5f7fa;
}

.header h1 {
  margin: 10px 0;
  font-size: 1.5em;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.company-name {
  font-weight: 500;
  color: #606266;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.el-menu-demo {
  border-radius: 0;
}
</style>