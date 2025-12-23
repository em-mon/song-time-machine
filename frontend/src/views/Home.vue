<template>
  <div class="home">
    <h1>Home Page</h1>
    <form @submit="searchSongs">
        <input
            v-model="songTitle"
            placeholder="Enter song title"
        />
        <input
            v-model="artistName"
            placeholder="Enter song artist"
            required
        />
        <input
            v-model="yearReleased"
            placeholder="Enter year released"
            required
        />
        <button type="submit">Find</button>
    </form>

    <ul v-if="results.length">
        <button v-for="track in results" :key="track.id" @click="saveSong(track)">
            <strong>{{ track.title }}</strong>
            — {{ track.user.username }}
        </button>
    </ul>

    <button @click="goToPast">Past</button>
    <button @click="goToFuture">Future</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const songTitle = ref('')
const artistName = ref('')
const yearReleased = ref('')
const results = ref([])

const goToPast = () => {
    sessionStorage.setItem('operation', 'past')
    router.push('./loading')
}

// if input year current year block off future option
// consider: error messages displayed, none returned = no songs in that year, suggest options
const goToFuture = () => {
    sessionStorage.setItem('operation', 'future')
    router.push('./loading')
}

const searchSongs = async (e) => {
    e.preventDefault()

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

    console.log("Try to search for track")
    const response = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        title: songTitle.value,
        artist: artistName.value,
        year: yearReleased.value,
        access_token
        })
    })

    const data = await response.json()
    results.value = data

    console.log("Searched track.")
}

const saveSong = async (track) => {
    // You now have access to all the track data from the search results
    // if no release_date created_date ???
    // check for tags???
    const metadata = {
        title: track.title,
        image: track.artwork_url,
        bpm: track.bpm,
        created_date: track.created_at,
        genre: track.genre,
        urn: track.urn,
        key_signature: track.key_signature,
        release_year: track.release_year,
        tags: track.tag_list,
        artist: track.user.username,
        access: track.access
    }
    
    // Save locally 
    sessionStorage.setItem('savedSong', JSON.stringify(metadata))
}
</script>