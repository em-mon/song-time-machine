import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()

app.use(express.json())
app.use(cors({
  origin: 'http://localhost:5173'
}))

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

  console.log("Before i try to auth/token")
  try {
    console.log("trying to authroizee in auth/token")
    const response = await fetch(
      'https://secure.soundcloud.com/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      }
    )

    console.log("trying to await in data from auth/token")
    const data = await response.json()
    res.json(data)
    console.log("received data from auth/token")
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Token exchange failed' })
  }
})

app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body

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
    const response = await fetch('https://secure.soundcloud.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Refresh token failed' })
  }
})

app.post('/api/search', async (req, res) => {
    console.log("Searching for track...")
    const { title, artist, year, access_token } = req.body

    if (!title || !artist || !access_token) {
        return res.status(400).json({ error: 'Missing fields' })
    }

    const url = new URL('https://api.soundcloud.com/tracks')
    url.searchParams.set('q', title)

    // Compute the min/max dates
    const inputYear = parseInt(year)
    const currentYear = new Date().getFullYear()

    const minYear = inputYear - 5
    // Don't go beyond current year
    const maxYear = Math.min(inputYear + 5, currentYear)  


    // Convert to YYYY-MM-DD HH:MM:SS format
    const fromDate = `${minYear}-01-01 00:00:00`
    const toDate = `${maxYear}-12-31 23:59:59`

    console.log("fromDate:", fromDate)
    console.log("toDate:", toDate)

    const timeframe = {
        "from": fromDate,
        "to": toDate
    }

    url.searchParams.set('created_at', JSON.stringify(timeframe))

    url.searchParams.append('access', 'playable')
    url.searchParams.append('access', 'preview')
    url.searchParams.append('access', 'blocked')
    
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

        // Filter tracks to match artist exactly
        // tracks = tracks.filter(t =>
        //     t.user.username.toLowerCase() === artist.toLowerCase()
        // )

        res.json(tracks)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Search failed' })
    }
})


app.listen(process.env.PORT, () => {
    console.log('Auth server running on port', process.env.PORT)
  })


