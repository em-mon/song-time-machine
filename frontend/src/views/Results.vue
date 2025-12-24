<template>
  <div class="results">
    <div class="stars"></div>
    
    <div class="content">
      <div v-if="loading">
        <h1 class="title">
          LOADING RESULTS<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
        </h1>
      </div>
      
      <div v-else-if="!results.length">
        <h1 class="title">NO RECOMMENDATIONS FOUND :[</h1>
        <button class="portal-button" @click="retry">
          Retry with different song
        </button>
      </div>
      
      <div v-else class="results-container">
        <h1 class="title">YOUR TIME MACHINE RESULTS</h1>
        
        <div class="tracks-list">
          <div 
            v-for="(track, index) in results" 
            :key="track.id" 
            class="track-item"
            :class="{ 'top-match': index === 0 }"
          >
            <img 
              :src="track.artwork_url" 
              :alt="track.title"
              class="track-artwork"
            />
            
            <div class="track-details">
              <div class="track-title">{{ track.title }}</div>
              <div class="track-artist">{{ track.user.username }}</div>
              <div class="track-year">{{ track.release_year }}</div>
            </div>
          </div>
        </div>

        <button class="portal-button" @click="retry">
          Retry with different song
        </button>
      </div>
    </div>
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.results {
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

.results-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 700px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: rgba(139, 0, 255, 0.1);
  border: 3px solid #fff;
  border-radius: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(139, 0, 255, 0.3);
}

.track-item:hover {
  transform: translateX(10px);
  box-shadow: 0 0 30px rgba(139, 0, 255, 0.5);
}

.track-item.top-match {
  border-color: #00d4ff;
  box-shadow: 
    0 0 30px rgba(0, 212, 255, 0.6),
    0 0 50px rgba(0, 212, 255, 0.4),
    inset 0 0 20px rgba(0, 212, 255, 0.2);
  background: rgba(0, 212, 255, 0.1);
}

.track-item.top-match:hover {
  box-shadow: 
    0 0 40px rgba(0, 212, 255, 0.8),
    0 0 60px rgba(0, 212, 255, 0.5),
    inset 0 0 30px rgba(0, 212, 255, 0.3);
}

.track-artwork {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

.track-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  text-align: left;
  flex-grow: 1;
}

.track-title {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.9rem;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.8);
  line-height: 1.4;
}

.track-artist {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.7rem;
  color: #e0d4ff;
  opacity: 0.9;
}

.track-year {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.6rem;
  color: #b8a5d6;
  opacity: 0.8;
}

.top-match .track-title {
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.8);
}

/* Responsive adjustments ???*/
@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }
  
  .portal-button {
    padding: 1rem 2rem;
  }
}
</style>