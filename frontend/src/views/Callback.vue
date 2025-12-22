<template>
  <div>
    <h1>Logging you in…</h1>
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

fetch('http://localhost:3000/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, code_verifier })
})
  .then(res => res.json())
  .then(data => {
    // Store tokens
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('expires_at', Date.now() + data.expires_in * 1000)

    router.push('/home')
  })
  .catch(err => {
    console.error(err)
    router.push('/')
  })
</script>
