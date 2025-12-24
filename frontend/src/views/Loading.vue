<template>
  <div class="loading">
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
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
/* make loading cycle???*/
.loading {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #2d1b69 0%, #1a0f3d 50%, #0a0520 100%);
  overflow: hidden;
}

/* Animated starfield background */
.stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: transparent;
}

.stars {
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, transparent),
    radial-gradient(2px 2px at 60px 70px, #fff, transparent),
    radial-gradient(1px 1px at 50px 50px, #ddd, transparent),
    radial-gradient(1px 1px at 130px 80px, #fff, transparent),
    radial-gradient(2px 2px at 90px 10px, #eee, transparent);
  background-repeat: repeat;
  background-size: 200px 200px;
  opacity: 0.8;
}

.content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 2rem;
  max-width: 800px;
}

.title {
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(1.5rem, 5vw, 3rem);
  color: #fff;
  text-shadow: 
    0 0 10px #ff00ff,
    0 0 20px #ff00ff,
    0 0 30px #ff00ff,
    0 0 40px #8b00ff,
    0 0 70px #8b00ff;
  margin-bottom: 2rem;
  line-height: 1.5;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }
  
  .portal-button {
    padding: 1rem 2rem;
  }
}
</style>