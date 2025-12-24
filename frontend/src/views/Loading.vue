<template>
  <div class="page">
    <div class="stars"></div>
    
    <div class="content">
      <h1 class="title">FETCHING SONGS...</h1>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'  
import { useRouter } from 'vue-router'

const router = useRouter()

// Define a function you want to run
const fetchSongs = async () => {
    let access_token = sessionStorage.getItem('access_token')
    const expires_at = parseInt(sessionStorage.getItem('expires_at'), 10)

    // If token is missing or expired, refresh it
    if (!access_token || Date.now() >= expires_at) {
        const refresh_token = sessionStorage.getItem('refresh_token')
        if (!refresh_token) {
            router.push('/') // no refresh token → force login
            return
        }

        try {
            const refreshRes = await fetch('http://localhost:3000/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token })
            })
            const refreshData = await refreshRes.json()

            access_token = refreshData.access_token
            sessionStorage.setItem('access_token', access_token)
            sessionStorage.setItem('refresh_token', refreshData.refresh_token)
            sessionStorage.setItem('expires_at', Date.now() + refreshData.expires_in * 1000)
        } catch (err) {
            console.error('Refresh failed', err)
            router.push('/') // redirect to login
            return
        }
    }

    // Parse savedSong before sending
    const savedSong = sessionStorage.getItem('savedSong')
    const songMetadata = savedSong ? JSON.parse(savedSong) : null
        
    if (!songMetadata) {
        console.error('No saved song found')
        router.push('/')
        return
    }

  
    const response = await fetch('http://localhost:3000/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        songMetadata: songMetadata,
        operation: sessionStorage.getItem('operation'),
        access_token
        })
    })

    const data = await response.json()
    // Store results in sessionStorage
    sessionStorage.setItem('recommendations', JSON.stringify(data.collection))
    
    // Navigate to results page
    router.push('/results')
};

// Use onMounted to call the function once the component is mounted
onMounted(() => {
  console.log('Component is mounted, calling fetchData...');
  fetchSongs();
});
</script>

<style scoped>
/* make loading cycle???*/

</style>