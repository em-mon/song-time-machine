<template>
  <div class="page">
    <div class="stars"></div>
    
    <div class="content">
      <h1 class="title">WELCOME TO THE TIME MACHINE</h1>
      <h2 class="subtitle">Click login to connect your SoundCloud account to the app!</h2>
      <button @click="login" class="portal-button">
        <span class="button-text">ENTER</span>
        <span class="button-glow"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const apiClient = inject('apiClient')

const login = async () => {
  apiClient.login()
}
</script>
