<template>
  <header class="app-header">
    <div class="logo-container">
      <RouterLink :to="{ name: 'Dashboard' }" class="logo-link"><h1>OrderFlow</h1></RouterLink>
    </div>

    <nav class="navigation-links" v-if="isAuthenticated">
      <RouterLink :to="{ name: 'Dashboard' }" class="nav-link">Dashboard</RouterLink>
      <RouterLink :to="{ name: 'OrderToday' }" class="nav-link">Today's Orders</RouterLink>
      <RouterLink :to="{ name: 'PastOrders' }" class="nav-link">Past Orders</RouterLink>
      <RouterLink :to="{ name: 'ItemSelectionPage' }" class="nav-link">Create Order</RouterLink>
    </nav>

    <div class="user-actions">
      <div v-if="isAuthenticated" class="authenticated-user">
        <span class="user-name">{{ user?.company_name || user?.email || 'User' }}</span>
        <el-button type="danger" @click="handleLogout" size="small" class="logout-button-el">
          Logout
        </el-button>
      </div>
      <div v-else class="guest-user">
        <RouterLink :to="{ name: 'Login' }" class="nav-link auth-link">Login</RouterLink>
        <RouterLink :to="{ name: 'Register' }" class="nav-link auth-link">Register</RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useStore } from 'vuex';
import { ElMessage, ElButton } from 'element-plus'; // Added ElButton

const store = useStore();
const router = useRouter();

const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const user = computed(() => store.getters['auth/user']);

const handleLogout = async () => {
  try {
    await store.dispatch('auth/logout');
    router.push({ name: 'Login' });
    ElMessage.success('Logged out successfully');
  } catch (error) {
    console.error('Logout failed:', error);
    ElMessage.error('Failed to logout. Please try again.');
  }
};
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px; /* Vertical and horizontal padding */
  background-color: #2c3e50; /* A modern, dark slate blue */
  color: #ecf0f1; /* Light text color for contrast */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.logo-container h1 {
  margin: 0;
  font-size: 1.8em;
  font-weight: 600;
}
.logo-link, .logo-link:hover, .logo-link:visited {
  color: #ffffff; /* Brighter white for logo */
  text-decoration: none;
}

.navigation-links {
  display: flex;
  gap: 25px; /* Spacing between links */
}

.nav-link {
  color: #bdc3c7; /* Slightly muted light color for links */
  text-decoration: none;
  font-size: 1em;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-exact-active { /* Style for active link */
  color: #ffffff;
  background-color: #34495e; /* Slightly lighter dark blue for hover/active */
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 15px; 
}

.authenticated-user, .guest-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  font-size: 0.95em;
  color: #ecf0f1;
  margin-right: 5px; /* Spacing before logout button */
}

/* Using ElButton now, so custom .logout-button class might not be needed unless for overrides */
.logout-button-el {
  /* ElButton will have its own styles, this is for potential minor adjustments */
}

.auth-link {
  color: #ecf0f1; /* Lighter color for auth links for distinction */
}
.auth-link:hover {
  color: #ffffff;
  background-color: #34495e;
}


/* Basic responsiveness: On smaller screens, you might want to hide links or stack them.
   This is a very simple example. A full solution would use a hamburger menu. */
@media (max-width: 768px) {
  .navigation-links {
    /* Example: Hide links or change layout. For now, just reduce gap or hide. */
    /* display: none; */ /* This would hide them completely */
    gap: 10px;
  }
  .logo-container h1 {
    font-size: 1.5em;
  }
  .user-actions {
    gap: 10px;
  }
  .app-header {
    padding: 15px;
  }
}
</style>
