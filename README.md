# 🎵 ListenExchange MVP

**Discover independent music. Share genuine feedback. Earn credits.**

A Next.js web app where artists submit tracks and listeners earn credits by genuinely listening and providing feedback.

## ✨ Features

### For Listeners

- 🎧 **Discover:** Listen to curated independent tracks
- 💬 **Feedback:** Share meaningful reviews (min 120 chars)
- ⏱️ **Real-Time Tracking:** 60 seconds of actual play time tracked
  - Doesn't count pauses
  - Doesn't count buffering
  - Doesn't count big seeks
- ⭐ **Earn Credits:** Get 1 credit per genuine feedback submission
- 📊 **History:** See all your feedbacks and credits earned

### For Artists

- 🎤 **Submit Tracks:** Share your Spotify link
- 📈 **Visibility:** Get honest feedback from real listeners
- 💰 **Ecosystem:** Later use credits to share your own music

## 🚀 Tech Stack

- **Framework:** Next.js 16.3.5 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **Music API:** Spotify oEmbed + iFrame API
- **State Management:** React hooks (no DB yet for MVP)

## 📋 Flow

```
Landing (/home)
    ├─ [Start Listening] → Discover (/discover)
    └─ [Submit a Track] → Submit (/submit)

Submit (/submit)
    1. Paste Spotify URL
    2. API fetches oEmbed data
    3. See preview (cover, title, embed)
    4. Click "Add This Track"

Discover (/discover)
    1. See track with Spotify embed
    2. Listen for 60 seconds of real time ⏱️
    3. At 60s: Feedback form unlocks
    4. Write feedback (min 120 chars)
    5. Submit → Earn +1 credit
    6. Next track
```

## 📁 Project Structure

```
listen-exchange/
├── app/
│   ├── api/oembed/route.ts        → Spotify oEmbed API
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── TrackCard.tsx           → Main listening component
│   ├── hooks/
│   │   └── useSpotifyTracker.ts    → 60s tracking logic
│   ├── types/spotify.ts
│   ├── page.tsx                    → Landing page
│   ├── submit/page.tsx
│   ├── discover/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── GUIDE_DEV.md                    → Developer guide
└── README.md                       → This file
```

## 🎯 Key Implementation Details

### Real-Time Listening Tracker

The `useSpotifyTracker` hook tracks genuine listening time:

```typescript
// Only counts when:
- Music is playing (!isPaused && !isBuffering)
- Position delta < 5 seconds (no big seeks)
- At least 100ms elapsed since last update

// Doesn't count:
- Pauses
- Buffering
- Seeking forward (>5s jump)
```

### Spotify Integration

1. **oEmbed:** Get metadata from Spotify URL
   - Title, cover image
   - Embed HTML code

2. **iFrame API:** Track actual playback
   - Position updates
   - Play/pause state
   - Duration info

## 🎨 Design

- Modern dark theme (independent music vibe)
- Spotify green accent (#22c55e)
- Mobile-responsive
- Large album artwork
- Clear feedback experience

## 📊 Data (MVP Phase)

**Mocked data:** 3 real Spotify tracks

- Blinding Lights - The Weeknd
- As It Was - Harry Styles
- Heat Waves - Glass Animals

No database yet. Data stored in React state.

## 🔧 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# Open http://localhost:3001

# Build for production
npm build

# Start production server
npm start
```

## 🌍 Pages

| Page     | Path        | Purpose           |
| -------- | ----------- | ----------------- |
| Landing  | `/`         | Hero with CTAs    |
| Discover | `/discover` | Listen & feedback |
| Submit   | `/submit`   | Add new track     |

## 📡 API Endpoints

### GET `/api/oembed`

```
Input:  GET /api/oembed?url=https://open.spotify.com/track/...
Output: { title, thumbnail_url, html, trackId, ... }
```

## 🎵 How It Works

1. **Artist** goes to `/submit`
2. **Artist** pastes Spotify track link
3. **API** fetches oEmbed data (title, cover, embed)
4. **Preview** shown to artist
5. **Artist** clicks "Add This Track"
6. **Track** added to discovery queue (stored in-memory for MVP)

---

7. **Listener** goes to `/discover`
8. **Listener** sees track with Spotify embed
9. **Listener** plays track on Spotify player
10. **Hook** tracks real listening time (60 seconds)
11. **Feedback form** unlocks at 60s
12. **Listener** writes feedback (min 120 characters)
13. **Listener** submits feedback
14. **Listener** earns +1 credit
15. **Listener** moves to next track

## 🚀 Roadmap

### Phase 1: MVP (Current)

- ✅ Spotify URL → oEmbed
- ✅ Real 60-second tracking
- ✅ Feedback form (120 char min)
- ✅ Credits earning
- ✅ Mock data

### Phase 2: Database

- [ ] Supabase integration
- [ ] User authentication
- [ ] Persistent data
- [ ] User profiles

### Phase 3: Advanced

- [ ] Leaderboards
- [ ] Artist dashboard
- [ ] Analytics
- [ ] Recommendations

## 🔐 Privacy & Ethics

- No personal data collected (MVP)
- All Spotify data from public oEmbed API
- Feedback is genuine engagement

## 💡 Why This Works

Traditional discovery is algorithm-driven. **ListenExchange** is human-driven:

- **For artists:** Real feedback from real listeners
- **For listeners:** Curated quality over algorithmic quantity
- **For the ecosystem:** Sustainable credit system incentivizes genuine engagement

## 📞 Support

See `GUIDE_DEV.md` for development documentation.

---

**Made with ❤️ for independent musicians**
