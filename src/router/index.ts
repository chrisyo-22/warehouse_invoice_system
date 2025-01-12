import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../components/HomePage.vue";
import Dashboard from "../components/Dashboard.vue";
import OrderToday from "../components/OrderToday.vue";
import PastOrders from "../components/PastOrders.vue";
import Invoice from "../components/Invoice/Invoice.vue";
import Login from "../components/Auth/Login.vue";
import Register from "../components/Auth/Register.vue";
import store from "../store";

const router = createRouter({
    history: createWebHistory("/"),
    routes: [
        {
            path: "/",
            component: HomePage,
            children: [
                {
                    path: "",
                    name: "Dashboard",
                    component: Dashboard,
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

// Navigation guard
router.beforeEach((to, from, next) => {
    const isAuthenticated = store.getters['auth/isAuthenticated'];

    // Routes that require authentication
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            next({ name: 'Login' });
            return;
        }
    }

    // Routes for guests only (login, register)
    if (to.matched.some(record => record.meta.guestOnly)) {
        if (isAuthenticated) {
            next({ name: 'Dashboard' });
            return;
        }
    }

    next();
});

export default router;
