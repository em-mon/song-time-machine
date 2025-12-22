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
