import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()

app.use(express.json())

app.use(cors({
  origin: "https://song-time-machine.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],  
  credentials: true
}))

app.options('*', cors())

// Exchange for token 
app.post('/auth/token', async (req, res) => {
  const { code, code_verifier } = req.body

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI,
    code,
    code_verifier
  })

  // Soundclouds way to fetch token
  try {
    const response = await fetch('https://secure.soundcloud.com/oauth/token',
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        })

    const data = await response.json()
    res.json(data)

  } catch (err) {
    console.error(err)
    throw new Error(err)
  }
})

app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body

  // another way to send bad statsus???
  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh_token' })
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    refresh_token
  })

  try {
    const response = await fetch('https://secure.soundcloud.com/oauth/token', 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        })

    const data = await response.json()
    // dont explicitly return???
    res.json(data)

  } catch (err) {
        console.error(err)
        throw new Error(err)
  }
})

app.post('/api/search', async (req, res) => {
    // whats urns???
    const { q, genres, bpm, created_at, access, limit, access_token } = req.body

    // search for similar tags and bpm???
    //const { q, urns, genres, tags, bpm, created_at, access, limit } = req.body

    if (!access_token) {
        return res.status(400).json({ error: 'Missing access_token' })
    }

    const url = new URL('https://api.soundcloud.com/tracks')
    
    if (q) {
        console.info("have q")
        url.searchParams.set('q', q)
    }

    if (genres) {
        url.searchParams.set('genres', genres)
    }

    if (bpm) {
        url.searchParams.set('bpm from', bpm.from)
        url.searchParams.set('bpm to', bpm.to)
    }

    if (created_at) {
        console.info("have created_at")
        url.searchParams.set('created_at', created_at)
    }

    if (access) {
        console.info("have access")
        url.searchParams.set('access', access)
    }

    if (limit) {
        console.info("have limit")
        url.searchParams.set('limit', limit)
    }
    
    try {
        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
            }
        })

        if (!response.ok) {
            const text = await response.text()
            console.error(text)
            return res.status(500).json({ error: 'SoundCloud API failed' })
        }

        const tracks = await response.json()
        console.log(tracks)
        res.json(tracks)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Search failed' })
    }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT)
})
