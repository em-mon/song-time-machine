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
    async searchTracks(title, artist, year) {
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

        // Build time range
        const minYear = year - 5
        const maxYear = Math.min(year + 5, new Date().getFullYear())
        const created_at = {
            from: `${minYear}-01-01 00:00:00`,
            to: `${maxYear}-12-31 23:59:59`
        }

        try {
            const response = await fetch(`${this.#_baseURL}/api/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: query,
                    created_at: JSON.stringify(created_at),
                    access: ['playable', 'preview', 'blocked'],
                    limit: 100000,
                    access_token
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Search failed')
            }

            const data = await response.json()
            const tracks = data

            // Filter by artist
            const filtered = tracks.filter(t =>
                t.user.username.toLowerCase() === artist.toLowerCase()
            )

            return filtered
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

// Create singleton instance
export const apiClient = new ApiClient(import.meta.env.VITE_BASE_URL)