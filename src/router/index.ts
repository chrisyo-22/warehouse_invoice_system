import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../page/HomePage.vue";
import Dashboard from "../page/Dashboard.vue";
import OrderToday from "../page/OrderToday.vue";
import PastOrders from "../page/PastOrders.vue";
import ItemSelectionPage from "../page/ItemSelectionPage.vue"; // Added import
import Invoice from "../page/Invoice.vue";
import Login from "../page/Login.vue";
import Register from "../page/Register.vue";
import store from "../store";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            component: HomePage,
            children: [
                {
                    path: "",
                    name: "Dashboard",
                    component: Dashboard,
                    meta: { requiresAuth: true }
                },
                {
                    path: "order-today",
                    name: "OrderToday",
                    component: OrderToday,
                    meta: { requiresAuth: true }
                },
                {
                    path: "past-orders",
                    name: "PastOrders",
                    component: PastOrders,
                    meta: { requiresAuth: true }
                },
                {
                    path: "item-selection", // New route
                    name: "ItemSelectionPage",
                    component: ItemSelectionPage,
                    meta: { requiresAuth: true }
                },
                {
                    path: "login",
                    name: "Login",
                    component: Login,
                    meta: { guestOnly: true }
                },
                {
                    path: "register",
                    name: "Register",
                    component: Register,
                    meta: { guestOnly: true }
                },
            ],
        },
        {
            path: '/invoice-preview',
            name: 'InvoicePreview',
            component: Invoice,
            meta: { requiresAuth: true }
        }
    ],
});

// Helper to get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const token = getToken();
    let isAuthenticated = store.getters['auth/isAuthenticated'];

    // If we have a token but not authenticated, try to validate it
    if (token && !isAuthenticated) {
        try {
            // Optionally, you can call an API endpoint to validate the token
            await store.dispatch('auth/validateToken', token);
            isAuthenticated = store.getters['auth/isAuthenticated'];
        } catch (e) {
            // If token is invalid, remove it
            localStorage.removeItem('token');
            isAuthenticated = false;
        }
    }

    // Routes that require authentication
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!token || !isAuthenticated) {
            next({ name: 'Login' });
            return;
        }
    }

    // Routes for guests only (login, register)
    if (to.matched.some(record => record.meta.guestOnly)) {
        if (token && isAuthenticated) {
            next({ name: 'Dashboard' });
            return;
        }
    }

    next();
});

export default router;
