import { Module, ActionContext } from 'vuex'
import { ElMessage } from 'element-plus'

// Types
interface User {
  id: string
  email: string
  company_name: string
  address: string
  postal_code: string
  province: string
  created_at: Date
  updated_at: Date
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

interface RootState {
  invoice: {
    owner: string
    recipient: string
    date: string
    items: any[]
  }
}

// Initial state
const state: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token')
}

// Auth module
const auth: Module<AuthState, RootState> = {
  namespaced: true,
  state,
  
  getters: {
    user: (state: AuthState) => state.user,
    token: (state: AuthState) => state.token,
    isAuthenticated: (state: AuthState) => state.isAuthenticated
  },

  mutations: {
    SET_USER(state: AuthState, user: User) {
      state.user = user
    },
    SET_TOKEN(state: AuthState, token: string) {
      state.token = token
      state.isAuthenticated = true
      localStorage.setItem('token', token)
    },
    CLEAR_AUTH(state: AuthState) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    }
  },

  actions: {
    async register(
      { commit }: ActionContext<AuthState, RootState>,
      credentials: { email: string; password: string; company_name: string; address: string; postal_code: string; province: string }
    ) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Registration failed')
        }

        const data = await response.json()
        commit('SET_USER', data.user)
        commit('SET_TOKEN', data.token)
        ElMessage.success('Registration successful!')
        return data
      } catch (error: any) {
        ElMessage.error(error.message || 'Registration failed')
        throw error
      }
    },

    async login(
      { commit }: ActionContext<AuthState, RootState>,
      credentials: { email: string; password: string }
    ) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Login failed')
        }

        const data = await response.json()
        commit('SET_USER', data.user)
        commit('SET_TOKEN', data.token)
        ElMessage.success('Login successful!')
        return data
      } catch (error: any) {
        ElMessage.error(error.message || 'Login failed')
        throw error
      }
    },

    async logout({ commit }: ActionContext<AuthState, RootState>) {
      commit('CLEAR_AUTH')
      ElMessage.success('Logged out successfully')
    },

    async fetchUser({ commit, state }: ActionContext<AuthState, RootState>) {
      if (!state.token) return

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${state.token}`
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            commit('CLEAR_AUTH')
          }
          throw new Error('Failed to fetch user')
        }

        const data = await response.json()
        commit('SET_USER', data)
        return data
      } catch (error: any) {
        if (error.message.includes('401')) {
          commit('CLEAR_AUTH')
        }
        throw error
      }
    },

    async validateToken({ commit }, token) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            commit('CLEAR_AUTH');
          }
          throw new Error('Invalid token');
        }

        const data = await response.json();
        commit('SET_USER', data);
        commit('SET_TOKEN', token);
        return true;
      } catch (error) {
        commit('CLEAR_AUTH');
        return false;
      }
    },
  }
}

export default auth 