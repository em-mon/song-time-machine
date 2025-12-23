<template>
  <div class="results">
    <h1>Recommendations</h1>
    
    <div v-if="loading">
      <p>Loading results...</p>
    </div>
    
    <div v-else-if="!results.length">
      <p>No recommendations found.</p>
    </div>
    
    <ul v-else>
      <li v-for="track in results" :key="track.id">
        <button @click="saveSong(track)">
          <strong>{{ track.title }}</strong>
          — {{ track.user.username }}
        </button>
      </li>
    </ul>
    <button @click="retry">
      Retry with different song
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const results = ref([])
const loading = ref(true)
const router = useRouter()

const retry = () => {
  router.push('./home')
}

const saveSong = (track) => {
    const songData = {
        id: track.id,
        title: track.title,
        artist: track.user.username,
        year: new Date(track.created_at).getFullYear(),
        // ... other fields
    }
    sessionStorage.setItem('savedSong', JSON.stringify(songData))
    console.log('Song saved:', songData)
}

onMounted(() => {
    // Retrieve results from sessionStorage
    const stored = sessionStorage.getItem('recommendations')
    
    if (stored) {
      results.value = JSON.parse(stored)
    }
    
    loading.value = false
})
</script>