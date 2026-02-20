// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Applicants from '../views/Applicants.vue';
import Events from '../views/Events.vue';
import Login from '../views/Login.vue';
import Prizes from '../views/Prizes.vue';
import Hardware from '@/views/Hardware.vue';
import store from "@/store/store.js";
import EventEdit from "@/views/EventEdit.vue";
import Sponsors from "@/views/Sponsors.vue";
import Activities from "@/views/Activities.vue";
import TeamRegistration from '@/views/TeamRegistration.vue';
import AuditLogs from "@/views/AuditLogs.vue";

const routes = [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: Dashboard },
    { path: '/applicants', component: Applicants },
    { path: '/prizes', component: Prizes },
    { path: '/teams', component: TeamRegistration },
    { path: '/events', component: Events, name: 'Events' },
    { path: '/activities', component: Activities, name: 'Activities' },
    { path: '/login', component: Login},
    { path: '/hardware', component: Hardware},
    {
        path: '/events/edit/:id',
        name: 'EventEdit',
        component: EventEdit,
        props: true
    },
    {path:"/sponsors", component: Sponsors},
    { path:"/audit-logs", component: AuditLogs, meta: { requiresOscar: true } }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    const userRole = store.state.user?.role;
    const hasPermissions = userRole === 'staff' || userRole === 'oscar';

    let isAuthenticated = !!store.state.user;
    if (!isAuthenticated) {
        const result = await store.dispatch('validateWithToken');
        isAuthenticated = result.success;
    }

    // Allow routing to login if NOT authenticated
    if (to.path === '/login') {
        if (isAuthenticated && hasPermissions) {
            return next('/dashboard'); // already logged in, redirect away
        } else {
            return next(); // allow login page
        }
    }

    // For all other routes that require auth
    if (!isAuthenticated || !hasPermissions) {
        return next('/login'); // redirect to login
    }

    // For routes that require oscar-level role
    if (to.meta.requiresOscar) {
        if (userRole !== 'oscar') {
            return next("/");
        }
    }

    next(); // allow route
});

export default router;
