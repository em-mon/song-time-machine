<template>
  <div class="page" id="home-page">
    <div>
        <h1 class="title" id="home-title">PICK ANY SONG...</h1>
    </div>

    <div class="content" id="home-content">
        <div>
            <form @submit="searchSongs">
                <input
                    v-model="songTitle"
                    placeholder="Enter song title"
                />
                <input
                    v-model="artistName"
                    placeholder="*Enter song artist*"
                    required
                />
                <input
                    v-model="yearReleased"
                    placeholder="*Enter year released*"
                    required
                />
                <button type="submit" id="home-portal-button">Search</button>
            </form>
        </div>
        
        <div v-if="results.length" class="carousel-container">
            <button @click="previousTrack" class="arrow-button">
                <span class="arrow-left">◄</span>
            </button>

            <div class="track-display">
                <button @click="saveSong(results[currentIndex])" class="track-card">
                    <img 
                        :src="results[currentIndex].artwork_url" 
                        :alt="results[currentIndex].title"
                        class="track-artwork"
                    />
                </button>
                
                <div class="track-info">
                    <div class="track-title">{{ results[currentIndex].title }}</div>
                    <div class="track-artist">{{ results[currentIndex].user.username }}</div>
                </div>

                <div class="track-counter">
                    {{ currentIndex + 1 }} / {{ results.length }}
                </div>

                <div>
                    <h2> Click to select! </h2>
                </div>
            </div>

            <button @click="nextTrack" class="arrow-button">
                <span class="arrow-right">►</span>
            </button>
        </div>

        <div id="op-button-div">
            <button class="op-button" id="past-button" @click="goToPast">PAST</button>
            <button class="op-button" id="future-button" @click="goToFuture">FUTURE</button>
        </div>
    </div>
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
const currentIndex = ref(0)

const previousTrack = () => {
    if (currentIndex.value === 0) {
        currentIndex.value = results.value.length - 1
    } else {
        currentIndex.value--
    }
}

const nextTrack = () => {
    if (currentIndex.value === results.value.length - 1) {
        currentIndex.value = 0
    } else {
        currentIndex.value++
    }
}

const goToPast = () => {
    sessionStorage.setItem('operation', 'past')
    router.push('./loading')
}
// set default pic??? error handling???
// must click submit before clicking past or future
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
    // block future if year current year???
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

<style scoped>
#home-page {
  display: block;
}

#home-content {
  display: block;
  justify-content: center;
  height: 78vh;
  width: 100%;
  left: 25%;
}

input {
    height: 1.5rem;
    margin-left: 8px;
}

#home-title {
    font-size: 3rem;
    padding-left: 50px;
}

#home-portal-button {
    margin-left: 5px;
    position: relative;
    height: 2rem;
    font-family: 'Press Start 2P', cursive;
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

#home-portal-button:hover {
  box-shadow: 
    0 0 40px rgba(255, 0, 255, 0.8),
    0 0 80px rgba(139, 0, 255, 0.6),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  border-color: #ff00ff;
}

#home-portal-button:active {
  transform: scale(1.05) translateY(-2px);
}

#home-portal-button:hover .button-glow {
  width: 300px;
  height: 300px;
}

.op-button {
    position: relative;
    height: 4rem;
    width: 7rem;
    font-family: 'Press Start 2P', cursive;
    background-size: 200% 200%;
    border: 3px solid #fff;
    border-radius: 15px;
    color: #fff;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
    animation: gradientShift 3s ease infinite;
}

#past-button {
    background: linear-gradient(45deg, #d2e0e0, #049eaf, #00ffff);
    box-shadow: 
        0 0 20px #d2e0e0,
        0 0 40px #049eaf,
        inset 0 0 20px rgba(255, 255, 255, 0.1);
    margin-right: 200px;
}

#past-button:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 
    0 0 40px #d2e0e0,
    0 0 80px #049eaf,
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  border-color:#00ffff;
}

#future-button {
    background: linear-gradient(45deg, #c60bff, #750844, #ff00ae);
    box-shadow: 
        0 0 20px #c60bff,
        0 0 40px #750844,
        inset 0 0 20px rgba(255, 255, 255, 0.1);
    margin-right: 18px;
}

#future-button:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 
    0 0 40px #c60bff,
    0 0 80px #750844,
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  border-color:#ff00ae;
}

#op-button-div {
    margin-top: 50px;
}

h2 {
    font-family: 'Press Start 2P', cursive;
    color: white;
    font-size: medium;
}

.carousel-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 2rem;
    min-height: 200px;
    margin: 2rem 0;
}

.arrow-button {
    background: linear-gradient(45deg, #8b00ff, #ff00ff);
    border: 2px solid #fff;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
    color: #fff;
    font-size: 1.5rem;
}

.arrow-button:hover {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(255, 0, 255, 0.8);
}

.track-card {
    cursor: pointer;
    gap: 1rem;
    transition: all 0.3s ease;
    box-shadow: 0 0 30px rgba(139, 0, 255, 0.6);
    line-height: 1.6;
    border: none;
    background: transparent; 
    padding: 0;
}

.track-card img{
    width: 250px; 
    height: auto;
}

.track-card:hover {
    transform: scale(1.05);
    box-shadow: 0 0 50px rgba(255, 0, 255, 0.9);
}

.track-title {
    font-size: 1.2rem;
    text-shadow: 0 0 10px rgba(255, 0, 255, 0.8);
    color: rgb(255, 177, 255);
}

.track-artist {
    font-size: 1rem;
    text-shadow: 0 0 8px rgba(139, 0, 255, 0.6);
    color: rgb(255, 177, 255);
}

.track-counter {
    position: absolute;
    bottom: 1rem;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.8rem;
    color: #e0d4ff;
    text-shadow: 0 0 10px rgba(139, 0, 255, 0.5);
}
</style>