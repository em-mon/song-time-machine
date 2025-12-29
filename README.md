# Song Time Machine

Discover music from the past or future based on your favorite songs! Select any track and travel through time to find similar songs released before or after it.

## Live Demo
**Try it here:** [[https://song-time-machine.vercel.app](https://song-time-machine.vercel.app)]

No installation required - just click and explore!

## ✨ Features

- 🔍 Search for any song on SoundCloud
- ⏮️ **PAST**: Discover similar songs released *before* your selection
- ⏭️ **FUTURE**: Find similar tracks released *after* your selection
- Smart recommendations based on:
  - Genre matching
  - BPM similarity
  - Tag overlap
  - (More coming soon!)

---

## 🛠️ Tech Stack

- **Frontend**: Vue 3 (Composition API), Vite, Vue Router
- **Backend**: Node.js, Express
- **API**: SoundCloud OAuth 2.1 + PKCE
- **Hosting**: Vercel (frontend), Fly.io (backend)
- **Styling**: Custom CSS with retro animations

---

## Known Issues

- Some songs on SoundCloud don't have `release_year` metadata (uses upload date as fallback)
- Limited to 200 tracks per search 
- Recommendations depend on available metadata (BPM, tags)

---

## Acknowledgments

- SoundCloud for their amazing API + cool metadata
- Vue.js team for the awesome framework
- Retro-futuristic design inspiration from synthwave aesthetics
