<template>
  <div class="page">
    <div class="stars"></div>
    
    <div class="content">
      <h1 class="title">LOGGING YOU IN...</h1>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'

const router = useRouter()
const apiClient = inject('apiClient')

onMounted(async () => {
  try {
    console.log("Exchanging tokens in callback")
    await apiClient.exchange()

    router.push('/home')
  } catch (err) {
    // maybe push failure page for errors???
    router.push('/')
    console.err(err)
    return
  }
})
</script>

<style scoped>
/* make loading cycle???*/
</style>
