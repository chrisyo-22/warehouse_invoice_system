<template>
  <div class="dashboard">
    <template v-if="isAuthenticated">
      <!-- Authenticated Dashboard Content -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="dashboard-card">
            <template #header>
              <h3>Quick Actions</h3>
            </template>
            <el-button type="primary" @click="$router.push('/order-today')">
              View Today's Orders
            </el-button>
            <el-button type="info" @click="$router.push('/past-orders')">
              View Past Orders
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="dashboard-card">
            <template #header>
              <h3>Company Information</h3>
            </template>
            <div class="company-info">
              <p><strong>Company:</strong> {{ user?.company_name }}</p>
              <p><strong>Email:</strong> {{ user?.email }}</p>
              <p><strong>Address:</strong> {{ user?.address }}</p>
              <p><strong>Province:</strong> {{ user?.province }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <template v-else>
      <!-- Guest Welcome Screen -->
      <el-card class="welcome-card">
        <template #header>
          <h2>Welcome to JinJin Food Service</h2>
        </template>
        
        <div class="welcome-content">
          <p class="welcome-message">
            Please log in to access your orders and manage your account.
          </p>
          
          <div class="auth-buttons">
            <el-button 
              type="primary" 
              size="large"
              @click="$router.push('/login')"
            >
              Login
            </el-button>
            
            <el-button 
              type="info" 
              size="large"
              @click="$router.push('/register')"
            >
              Register
            </el-button>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
const user = computed(() => store.getters['auth/user'])
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard-card {
  margin-bottom: 20px;
}

.welcome-card {
  max-width: 600px;
  margin: 40px auto;
}

.welcome-content {
  text-align: center;
  padding: 20px 0;
}

.welcome-message {
  font-size: 1.2em;
  color: #606266;
  margin-bottom: 30px;
}

.auth-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.company-info p {
  margin: 10px 0;
}

.el-button {
  margin: 10px;
}
</style>