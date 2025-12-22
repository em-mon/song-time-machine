<template>
  <div class="landing">
    <h1>Landing Page</h1>
    <button @click="login">Login</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// Parameters to build authorization uri
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