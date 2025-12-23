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

    let titleOrArtist = title
    if (!title) {
        titleOrArtist = artist
    }
    
    if (!artist || !access_token) {
        return res.status(400).json({ error: 'Missing fields' })
    }

    const url = new URL('https://api.soundcloud.com/tracks')
    url.searchParams.set('q', titleOrArtist)

    // Compute the min/max dates
    const inputYear = parseInt(year)
    const currentYear = new Date().getFullYear()

    const minYear = inputYear - 5
    // Don't go beyond current year
    const maxYear = Math.min(inputYear + 5, currentYear)  


    // Convert to YYYY-MM-DD HH:MM:SS format
    const fromDate = `${minYear}-01-01 00:00:00`
    const toDate = `${maxYear}-12-31 23:59:59`

    const timeframe = {
        "from": fromDate,
        "to": toDate
    }

    url.searchParams.set('created_at', JSON.stringify(timeframe))
    url.searchParams.set('limit', 10000)

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

        let tracks = await response.json()

        // Filter tracks to match artist exactly
        tracks = tracks.filter(t =>
            t.user.username.toLowerCase() === artist.toLowerCase()
        )

        res.json(tracks)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Search failed' })
    }
})

app.post('/api/recommend', async (req, res) => {
    const { songMetadata, operation, access_token } = req.body

    if (!songMetadata) {
        return res.status(400).json({ error: 'Missing fields' })
    }

    // call and return all related songs -> filter by year released
    // if no released do created
    const url = new URL(`https://api.soundcloud.com/tracks`)
    url.searchParams.set('genres', songMetadata.genre)
    
    // Compute the min/max dates
    let inputYear = null

    // Prefer release_year if available
    if (songMetadata.release_year) {
        inputYear = parseInt(songMetadata.release_year, 10)
    } 
    // Otherwise fall back to created_date (e.g. "2004-11-23")
    else if (songMetadata.created_date) {
        inputYear = parseInt(songMetadata.created_date.slice(0, 4), 10)
    }
    const currentYear = new Date().getFullYear()

    let minYear = 1000
    let maxYear = currentYear

    if (operation === "past") {
        maxYear = inputYear - 1
    } else if (operation === "future") {
        minYear = inputYear + 1
    }

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
    url.searchParams.set('limit', 10000)
    
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

        const data = await response.json()
        let relatedTracks = data || []
        console.log(relatedTracks.length)


        // Filter out songs by the same artist
        // relatedTracks = relatedTracks.filter(track => 
        //     track.user.username!== songMetadata.artist
        // )

        // Calculate similarity score for each track
        relatedTracks = relatedTracks.map(track => {
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
            
            // BPM similarity (up to 5 points based on closeness)
            if (track.bpm && songMetadata.bpm) {
                console.log("In bpm overlap")
                const bpmDiff = Math.abs(track.bpm - songMetadata.bpm)
                if (bpmDiff < 5) score += 5
                else if (bpmDiff < 10) score += 3
                else if (bpmDiff < 20) score += 1
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

        res.json({ collection: top10Songs })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Search failed' })
    }

    // search for tracks with genres, tags, bpms -> filter by year released or created

    // find a way to organize by percentage compatibility and return 

    // return songs similar in sound (genre, bpm) and similar in meaning (lyrics, tags)
})

app.listen(process.env.PORT, () => {
    console.log('Auth server running on port', process.env.PORT)
})


