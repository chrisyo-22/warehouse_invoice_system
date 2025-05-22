<template>
  <header class="app-header">
    <div class="logo-container">
      <h1>OrderFlow</h1>
    </div>

    <nav class="navigation-links">
      <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
      <RouterLink to="/orders" class="nav-link">Orders</RouterLink>
      <RouterLink to="/products" class="nav-link">Products</RouterLink>
      <!-- Add more links as needed -->
    </nav>

    <div class="user-actions">
      <span class="user-name">John Doe</span> <!-- Placeholder -->
      <button class="logout-button">Logout</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

// Future: Import user store or auth logic to get real user name
// const userName = ref('John Doe'); // Example if dynamic
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
  color: #ffffff; /* Brighter white for logo */
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
  gap: 15px; /* Spacing between user name and button */
}

.user-name {
  font-size: 0.95em;
  color: #ecf0f1;
}

.logout-button {
  background-color: #e74c3c; /* A soft red for logout */
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.logout-button:hover {
  background-color: #c0392b; /* Darker red on hover */
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
