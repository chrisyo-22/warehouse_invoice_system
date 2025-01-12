<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>Login</h2>
      </template>
      
      <el-form 
        :model="loginForm" 
        :rules="rules"
        ref="loginFormRef"
        label-position="top"
      >
        <el-form-item label="Email" prop="email">
          <el-input 
            v-model="loginForm.email" 
            placeholder="Enter your email"
            type="email"
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input 
            v-model="loginForm.password" 
            placeholder="Enter your password"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            :loading="loading"
            class="submit-button"
          >
            Login
          </el-button>
        </el-form-item>

        <div class="register-link">
          Don't have an account? 
          <router-link to="/register">Register here</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const store = useStore()
const loading = ref(false)
const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  email: '',
  password: ''
})

const rules = reactive<FormRules>({
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ]
})

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    await store.dispatch('auth/login', loginForm)
    router.push('/')
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.submit-button {
  width: 100%;
}

.register-link {
  text-align: center;
  margin-top: 16px;
}

.register-link a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style> 