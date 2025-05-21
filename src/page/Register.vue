<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2>Register</h2>
      </template>
      
      <el-form 
        :model="registerForm" 
        :rules="rules"
        ref="registerFormRef"
        label-position="top"
      >
        <el-form-item label="Company Name" prop="company_name">
          <el-input 
            v-model="registerForm.company_name" 
            placeholder="Enter your company name"
          />
        </el-form-item>

        <el-form-item label="Email" prop="email">
          <el-input 
            v-model="registerForm.email" 
            placeholder="Enter your email"
            type="email"
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input 
            v-model="registerForm.password" 
            placeholder="Enter your password"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="Address" prop="address">
          <el-input 
            v-model="registerForm.address" 
            placeholder="Enter your address"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-form-item label="Postal Code" prop="postal_code">
          <el-input 
            v-model="registerForm.postal_code" 
            placeholder="Enter your postal code"
          />
        </el-form-item>

        <el-form-item label="Province" prop="province">
          <el-select 
            v-model="registerForm.province" 
            placeholder="Select your province"
            class="province-select"
          >
            <el-option label="Alberta" value="AB" />
            <el-option label="British Columbia" value="BC" />
            <el-option label="Manitoba" value="MB" />
            <el-option label="New Brunswick" value="NB" />
            <el-option label="Newfoundland and Labrador" value="NL" />
            <el-option label="Nova Scotia" value="NS" />
            <el-option label="Ontario" value="ON" />
            <el-option label="Prince Edward Island" value="PE" />
            <el-option label="Quebec" value="QC" />
            <el-option label="Saskatchewan" value="SK" />
          </el-select>
        </el-form-item>

        <el-form-item label="Telephone" prop="telephone">
          <el-input 
            v-model="registerForm.telephone" 
            placeholder="Enter your telephone number"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleRegister" 
            :loading="loading"
            class="submit-button"
          >
            Register
          </el-button>
        </el-form-item>

        <div class="login-link">
          Already have an account? 
          <router-link to="/login">Login here</router-link>
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
const registerFormRef = ref<FormInstance>()

const registerForm = reactive({
  company_name: '',
  email: '',
  password: '',
  address: '',
  postal_code: '',
  province: '',
  telephone: ''
})

const rules = reactive<FormRules>({
  company_name: [
    { required: true, message: 'Please enter your company name', trigger: 'blur' },
    { min: 2, message: 'Company name must be at least 2 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ],
  address: [
    { required: true, message: 'Please enter your address', trigger: 'blur' },
    { min: 5, message: 'Address must be at least 5 characters', trigger: 'blur' }
  ],
  postal_code: [
    { required: true, message: 'Please enter your postal code', trigger: 'blur' },
    { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, message: 'Please enter a valid Canadian postal code', trigger: 'blur' }
  ],
  province: [
    { required: true, message: 'Please select your province', trigger: 'change' }
  ],
  telephone: [
    { required: true, message: 'Please enter your telephone number', trigger: 'blur' },
    { pattern: /^\+?1?\d{10,}$/, message: 'Please enter a valid telephone number', trigger: 'blur' }
  ]
})

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()
    loading.value = true
    
    await store.dispatch('auth/register', registerForm)
    router.push('/')
  } catch (error) {
    console.error('Registration error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
}

.register-card {
  width: 100%;
  max-width: 500px;
}

.submit-button {
  width: 100%;
}

.province-select {
  width: 100%;
}

.login-link {
  text-align: center;
  margin-top: 16px;
}

.login-link a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style> 