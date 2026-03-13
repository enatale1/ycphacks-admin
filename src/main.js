import { createApp } from 'vue';
import App from './App.vue';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';

import router from './router'
import store from './store/store.js';
import BootstrapVue3 from 'bootstrap-vue-3';
import axios from "axios";

// Axios interceptor to add the Token automatically
axios.interceptors.request.use((config) => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('token='));
    if (cookie) {
        const token = cookie.split('=')[1];
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const app = createApp(App)
app.use(BootstrapVue3);
app.use(router)
app.use(store)
app.mount('#app')
