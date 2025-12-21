<template>
  <div class="home">
    <h1>Home Page</h1>
    <button @click="goToResults">Past</button>
    <button @click="goToResults">Future</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToResults = () => {
    router.push('./results')
}
</script>