<template>
  <div class="home">
    <h1>Home Page</h1>
    <form>
        <label>
            Search for your song by entering fields:
            <input name="song-name" placeholder="Enter song title" required/>
            <input name="artist-name" placeholder="Enter song artist" required/>
        </label>
        <button @click="searchSongs">Find</button>
    </form>
    <button @click="goToPast">Past</button>
    <button @click="goToFuture">Future</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToPast = () => {
    router.push('./results')
}

const goToFuture = () => {
    router.push('./results')
}

function searchSongs() {
    
}
</script>