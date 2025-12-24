<template>
  <div class="landing">
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
import { useRouter } from 'vue-router'

const router = useRouter()

// Parameters to build authorization uri
// get rid of div???
const client_id = import.meta.env.VITE_CLIENT_ID
const redirect_uri = import.meta.env.VITE_REDIRECT_URI
const authorize_url = 'https://secure.soundcloud.com/authorize'

// Helper functions for PKCE code challenge and state
const generateRandomString = (length) => {
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('')
}

const sha256 = async (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return await window.crypto.subtle.digest('SHA-256', data)
}

// Helper encoder
const base64UrlEncode = (buffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

// Login function to authorize soundcloud users
const login = async () => {
    // Call helpers to generate and encode parameters
    const code_verifier = generateRandomString(64)
    const hashed = await sha256(code_verifier)
    const code_challenge = base64UrlEncode(hashed)

    // Store verifier for token exchange later (??? remove after session)
    sessionStorage.setItem('pkce_code_verifier', code_verifier)

    // Build the uri
    const params = new URLSearchParams({
        client_id,
        redirect_uri,
        response_type: 'code',
        code_challenge,
        code_challenge_method: 'S256',
        state: crypto.randomUUID()
    })

    window.location.href = `${authorize_url}?${params.toString()}`
}

</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.landing {
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

.subtitle {
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(0.7rem, 2vw, 1rem);
  color: #e0d4ff;
  margin-bottom: 3rem;
  line-height: 1.8;
  text-shadow: 0 0 10px rgba(139, 0, 255, 0.5);
}

.portal-button {
  position: relative;
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  padding: 1.5rem 3rem;
  background: linear-gradient(45deg, #8b00ff, #ff00ff, #8b00ff);
  background-size: 200% 200%;
  border: 3px solid #fff;
  border-radius: 15px;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: gradientShift 3s ease infinite;
  box-shadow: 
    0 0 20px rgba(255, 0, 255, 0.5),
    0 0 40px rgba(139, 0, 255, 0.3),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.portal-button:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 
    0 0 40px rgba(255, 0, 255, 0.8),
    0 0 80px rgba(139, 0, 255, 0.6),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  border-color: #ff00ff;
}

.portal-button:active {
  transform: scale(1.05) translateY(-2px);
}

.button-text {
  position: relative;
  z-index: 2;
  display: block;
}

.button-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.portal-button:hover .button-glow {
  width: 300px;
  height: 300px;
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