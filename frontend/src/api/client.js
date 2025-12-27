class ApiClient {
    #_baseURL;

    constructor(baseURL) {
        this.#_baseURL = baseURL
    }

    // Login function sends request to server to authorize user
    async login() {
        // Generate PKCE parameters
        const code_verifier = generateRandomString(64)
        const hashed = await sha256(code_verifier)
        const code_challenge = base64UrlEncode(hashed)
        const state = generateRandomString(32)

        const authorize_url = 'https://secure.soundcloud.com/authorize'

        // Store for later use in callback
        sessionStorage.setItem('pkce_code_verifier', code_verifier)
        sessionStorage.setItem('oauth_state', state)

        // Build authorization URL
        const params = new URLSearchParams({
            client_id: import.meta.env.VITE_CLIENT_ID,
            redirect_uri: import.meta.env.VITE_REDIRECT_URI,
            response_type: 'code',
            code_challenge: code_challenge,
            code_challenge_method: 'S256',
            state: state
        })

        // Redirect user's browser to SoundCloud
        window.location.href = `${authorize_url}?${params.toString()}`
    }

    async exchange() {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')

        // Verify state to prevent CSRF
        const savedState = sessionStorage.getItem('oauth_state')
        const code_verifier = sessionStorage.getItem('pkce_code_verifier')

        if (!code || !code_verifier) {
            throw new Error("Missing code or verifier when exchanging, please try logging in again.")
        }

        if (state !== savedState) {
            throw new Error("Mismatch authorization state, please try logging in again.")
        }

        try {
            const response = await fetch(`${this.#_baseURL}/auth/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, code_verifier })
                })

            if (!response.ok) {
                throw new Error('Token exchange failed')
            }

            const data = await response.json()

            // Store tokens
            sessionStorage.setItem('access_token', data.access_token)
            sessionStorage.setItem('refresh_token', data.refresh_token)
            sessionStorage.setItem('expires_at', Date.now() + data.expires_in * 1000)

            // Clean up
            sessionStorage.removeItem('pkce_code_verifier')
            sessionStorage.removeItem('oauth_state')

            return
        } catch (err) {
            console.error('Token exchange failed:', err)
            throw new Error(err)
        }
    }
    // Refresh access token
    async refresh(refresh_token) {
        const response = await fetch(`${this.#_baseURL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token }) 
        })

        if (!response.ok) {
            throw new Error('REFRESH_FAILED')
        }

        const data = await response.json()

        // Update stored tokens
        sessionStorage.setItem('access_token', data.access_token)
        sessionStorage.setItem('refresh_token', data.refresh_token)
        sessionStorage.setItem('expires_at', Date.now() + data.expires_in * 1000)

        return data.access_token
    }

    // Get valid access token (refresh if needed)
    async getAccessToken() {
        let access_token = sessionStorage.getItem('access_token')
        const expires_at = parseInt(sessionStorage.getItem('expires_at'), 10)

        // If token is missing or expired, refresh it
        if (!access_token || Date.now() >= expires_at) {
            const refresh_token = sessionStorage.getItem('refresh_token')
            
            if (!refresh_token) {
                throw new Error('NO_REFRESH_TOKEN')
            }

            try {
                access_token = await this.refresh(refresh_token)
            } catch (err) {
                console.error('Refresh failed:', err)
                throw new Error('REFRESH_FAILED')
            }
        }

        return access_token
    }


    // Search for tracks
    async searchTracks(title, artist) {
        // Validate required fields
        if (!artist) {
            throw new Error('Artist is required')
        }

        // Get valid access token
        let access_token
        try {
            access_token = await this.getAccessToken()
        } catch (err) {
            // Let component handle redirect
            throw err
        }

        // Build query
        let query = title || artist

        try {
            const response = await fetch(`${this.#_baseURL}/api/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: query,
                    access: 'playable,preview,blocked',
                    limit: 5000,
                    access_token
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Search failed')
            }

            const data = await response.json()
            let tracks = data

            // Filter by artist
            tracks = tracks.filter(t =>
                t.user.username.toLowerCase() === artist.toLowerCase()
            )

            return tracks
        } catch (err) {
            console.error('Search error:', err)
            throw err
        }
    }

    async recommendTracks() {
        // Get valid access token
        let access_token
        try {
            access_token = await this.getAccessToken()
        } catch (err) {
            // Let component handle redirect
            throw err
        }

        // Parse savedSong before sending
        const savedSong = sessionStorage.getItem('savedSong')
        const songMetadata = savedSong ? JSON.parse(savedSong) : null

        const operation = sessionStorage.getItem('operation')
            
        if (!songMetadata) {
            console.error('No saved song found')
            return
        }

        const bpm = {
            from: parseInt(songMetadata.bpm,10) - 10,
            to: parseInt(songMetadata.bpm,10) + 10
        }

        try {
            const response = await fetch(`${this.#_baseURL}/api/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    genres: songMetadata.genre,
                    bpm: bpm,
                    access: 'playable,preview,blocked',
                    limit: 100000,
                    access_token
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Search failed')
            }

            const data = await response.json()

            const top10 = similarityScore(data, songMetadata, operation)

            // Store results in sessionStorage
            sessionStorage.setItem('recommendations', JSON.stringify(top10.collection))
            
            return
        } catch (err) {
            console.error('Search error:', err)
            throw err
        }
    }
}

// Helper functions for PKCE code challenge and state
function generateRandomString(length) {
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('')
}

async function sha256(plain) {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return await window.crypto.subtle.digest('SHA-256', data)
}

// Helper encoder
function base64UrlEncode(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

function similarityScore(tracks, songMetadata, op) {
    let myYear
    if (songMetadata.release_year & songMetadata.year) {
        myYear = Math.min(parseInt(songMetadata.release_year, 10), parseInt(songMetadata.year, 10))
    } else if (songMetadata.release_year || songMetadata.year) {
        myYear = songMetadata.release_year || songMetadata.year
    } else {
        // no year so do warning that results aren't accurate???
    }
    console.log("release year:", songMetadata.rel)

    // Filter songs by release year
    if (op === "past") {
        tracks = tracks.filter(track => {
            // Get track year (prefer release_year, fallback to created_at)
            const trackYear = track.release_year 
                ? parseInt(track.release_year, 10)
                : new Date(track.created_at).getFullYear()
            
            // Keep only tracks BEFORE your song
            return trackYear < myYear
        })
    } else if (op === "future") {
        tracks = tracks.filter(track => {
            const trackYear = track.release_year 
                ? parseInt(track.release_year, 10)
                : new Date(track.created_at).getFullYear()
                        
            // Keep only tracks AFTER your song
            return trackYear > myYear
        })
    }

    // Calculate similarity score for each track
    const relatedTracks = tracks.map(track => {
        let score = 0
            
        // Tag overlap (2 points per matching tag)
        if (track.tag_list && songMetadata.tags) {
            console.log("track tag", track.tag_list)
            console.log("song tag", songMetadata.tags)
            const originalTags = songMetadata.tags.toLowerCase().split(' ').filter(t => t.length > 0)
            const trackTags = track.tag_list.toLowerCase().split(' ').filter(t => t.length > 0)
            const overlap = originalTags.filter(tag => trackTags.includes(tag)).length
            score += overlap * 2
        }
            
        return {
            ...track,
            similarityScore: score
            }
    })

    // Sort by similarity score (highest first)
    relatedTracks.sort((a, b) => b.similarityScore - a.similarityScore)

    console.log('Top track scores:', relatedTracks.slice(0, 10).map(t => ({
        title: t.title,
        artist: t.user.username,
        score: t.similarityScore
    })))

    // Get top 10
    const top10Songs = relatedTracks.slice(0, 10)
    const results = {
        collection: top10Songs
    }

    return results
    
    // search for tracks with genres, tags, bpms -> filter by year released or created

    // find a way to organize by percentage compatibility and return 

    // return songs similar in sound (genre, bpm) and similar in meaning (lyrics, tags)
}

// Create singleton instance
export const apiClient = new ApiClient(import.meta.env.VITE_BASE_URL)