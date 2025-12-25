import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { apiClient } from './api/client'
import './styles.css'

const app = createApp(App)

// Provide API client to all components
app.provide('apiClient', apiClient)

app.use(router).mount('#app')
