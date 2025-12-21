import { createRouter, createWebHistory } from 'vue-router'
import Landing from '../views/Landing.vue'
import Home from '../views/Home.vue'
import Results from '../views/Results.vue'

// All pages for my web app
const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/results',
    name: 'Results',
    component: Results
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
