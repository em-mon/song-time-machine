<template>
  <div class="callback">
    <div class="stars"></div>
    
    <div class="content">
      <h1 class="title">LOGGING YOU IN...</h1>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const params = new URLSearchParams(window.location.search)
const code = params.get('code')

const code_verifier = sessionStorage.getItem('pkce_code_verifier')

// If fails redirect to failure page???
if (!code || !code_verifier) {
  router.push('/')
}

console.log("In callback fetch auth token")
fetch('http://localhost:3000/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, code_verifier })
})
  .then(async res => {
    console.log('Response status after fetch');
    return res.json()
  })
  .then(data => {
    
    console.log("Store tokens")
    // Store tokens (expiration???)
    sessionStorage.setItem('access_token', data.access_token)
    sessionStorage.setItem('refresh_token', data.refresh_token)
    sessionStorage.setItem('expires_at', Date.now() + data.expires_in * 1000)

    sessionStorage.removeItem('pkce_code_verifier')

    router.push('/home')
  })
  .catch(err => {
    console.error(err)
    router.push('/')
  })
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
/* make loading cycle???*/
.callback {
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
