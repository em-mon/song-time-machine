<template>
  <div class="page">
    <div class="stars"></div>
    
    <div class="content">
      <h1 class="title">FETCHING SONGS...</h1>
    </div>
  </div>
</template>

<script setup>
import { onMounted, inject } from 'vue'  
import { useRouter } from 'vue-router'

const router = useRouter()
const apiClient = inject('apiClient')

// Use onMounted to call the function once the component is mounted
onMounted(async () => {
  console.log('Component is mounted, fetching songs...');

  try {
    await apiClient.recommendTracks()

    router.push('/results')
  } catch (err) {
    // maybe push failure page for errors???
    router.push('/')
    console.error(err)
    return
  }
});
</script>

<style scoped>
/* make loading cycle???*/
</style>