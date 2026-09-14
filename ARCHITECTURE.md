# ListenExchange - Notes d'Architecture & Décisions

## 🏗️ Décisions Architecturales

### 1. Pourquoi useSpotifyTracker (vs. inline hook)

**Décision:** Isoler la logique Spotify tracking dans un hook dédié

**Raisons:**

- Réutilisabilité: Peut être utilisé dans d'autres composants
- Testabilité: Facile à unit test isolément
- Maintenabilité: Logique complexe centralisée
- Séparation des concerns: TrackCard reste simple

```typescript
// ❌ Avant (inline)
export function TrackCard() {
  const [totalListenedMs, setTotalListenedMs] = useState(0);
  // ... 100+ lignes de logique Spotify ici
}

// ✅ Après (hook)
export function TrackCard() {
  const { listeningState, progressPercent } = useSpotifyTracker();
  // ... composant clean et lisible
}
```

### 2. Pourquoi Spotify oEmbed (vs. Web API)

**Décision:** Utiliser Spotify oEmbed pour les métadonnées

**Raisons:**

- ✓ Pas d'authentification nécessaire
- ✓ Données publiques uniquement
- ✓ Simple et rapide
- ✗ Web API necessite OAuth (trop complexe pour MVP)
- ✗ Web API limites de rate limit

```typescript
// ✓ oEmbed (MVP)
GET https://open.spotify.com/oembed?url=...
→ title, cover, embed HTML

// ✗ Web API (Future)
GET https://api.spotify.com/v1/tracks/{id}
→ Besoin: access_token
→ Plus complexe, mais plus de données
```

### 3. Pourquoi iFrame API (vs. Web API)

**Décision:** Utiliser Spotify iFrame API pour tracking playback

**Raisons:**

- ✓ Accès au playback state en temps réel
- ✓ Pas d'authentification
- ✓ Fonctionne directement depuis page
- ✓ isPaused, isBuffering, position disponibles
- ✗ Web API nécessite token

```typescript
// Spotify iFrame API available via:
<iframe src="https://open.spotify.com/embed/track/..."></iframe>

// Ensuite:
window.onSpotifyIframeApiReady = (IFrameAPI) => {
  IFrameAPI.addListener((state) => {
    console.log(state.isPaused);
    console.log(state.position);
  });
}
```

## 🎯 Algorithme Tracking - Détails

### Pseudocode du Tracking

```
WHEN Spotify state changes:
  currentTime = now()
  timeDelta = currentTime - lastUpdateTime
  positionDelta = abs(currentPosition - lastValidPosition)

  IF music is playing AND no buffering:

    IF timeDelta > 100ms AND positionDelta < 5000ms:
      // Good: reasonable time passed, no big seek
      totalListenedMs += timeDelta
      lastValidPosition = currentPosition
      lastUpdateTime = currentTime

      IF totalListenedMs >= 60000:
        hasReached60Seconds = true

    ELSE IF timeDelta > 100ms AND positionDelta >= 5000ms:
      // Seek detected: don't add time, just update timestamp
      lastUpdateTime = currentTime

  ELSE IF paused OR buffering:
    // Pause/buffering: don't add time, update timestamp
    lastUpdateTime = currentTime
```

### Exemple Pas-à-Pas

```
Time   | Position | Event         | Action        | Total
-------|----------|---------------|---------------|-------
0s     | 0ms      | Start playing | Init          | 0s
1s     | 1000ms   | Update        | Add 1000ms    | 1s
2s     | 2000ms   | Update        | Add 1000ms    | 2s
3s     | 3000ms   | Update        | Add 1000ms    | 3s
4s     | 3000ms   | Paused        | No add        | 3s
5s     | 3000ms   | Still paused  | No add        | 3s
6s     | 4000ms   | Resume        | Add 1000ms    | 4s
7s     | 20000ms  | BIG SEEK!     | No add        | 4s (skip added)
8s     | 21000ms  | Update        | Add 1000ms    | 5s
...continues...
60s    | ~60000ms | Reaching 60s  | UNLOCK FORM   | 60s
```

## 💾 État Management (MVP)

### État Local vs. Global

**MVP Approach:** État local + React state

```typescript
// /discover/page.tsx
const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
const [feedbackHistory, setFeedbackHistory] = useState([]);
const [credits, setCredits] = useState(0);

// Dans TrackCard:
const { listeningState } = useSpotifyTracker();
// État local du hook
```

**Limitations:**

- Données perdues au refresh
- Pas de persistence
- Pas de sync entre onglets
- OK pour MVP, pas pour production

**Phase 2 - Supabase:**

```typescript
// Context Provider
<UserProvider>
  <TracksProvider>
    <App />
  </TracksProvider>
</UserProvider>

// Queries
const { data: user } = useUser();
const { data: tracks } = useTracks();
const { mutate: submitFeedback } = useSubmitFeedback();

// Mutation
submitFeedback({
  trackId,
  content,
  userId: user.id
}).then(() => {
  // Revalidate user credits
  queryClient.invalidateQueries(['user', userId]);
});
```

## 🔐 Security Considerations

### MVP (No Auth)

```
✓ Safe for MVP:
- Public Spotify data only
- No user data
- No payment info
- No authentication needed

⚠️ Not safe for production:
- Anyone can claim credits
- No user validation
- No rate limiting
- Vulnerable to abuse
```

### Production (Phase 2)

```typescript
// Add authentication
POST /api/auth/login
  → JWT token

// Verify token on protected endpoints
POST /api/feedback
  Authorization: Bearer {token}
  → Only authenticated users
  → Credits tied to user ID
  → Rate limiting per user

// Verify data
VALIDATE trackId exists
VALIDATE userId matches token
VALIDATE feedback length >= 120
VALIDATE not duplicate submission
VALIDATE user hasn't already reviewed track
```

## 🎨 Design System - Tokens

### Colors

```typescript
const colors = {
  // Background
  bg: {
    darkest: "#0a0a0a", // Page bg
    dark: "#1a1a1a", // Card bg
    medium: "#2a2a2a", // Hover
  },

  // Text
  text: {
    primary: "#ededed", // Main text
    secondary: "#999999", // Dimmed text
    muted: "#666666", // Very dimmed
  },

  // Accent
  accent: {
    green: "#22c55e", // Spotify green - Primary CTA
    blue: "#3b82f6", // Info, progress
    orange: "#fb923c", // Warning
    red: "#ef4444", // Error
  },

  // Borders
  border: "rgba(255,255,255,0.1)",
};
```

### Spacing Scale

```typescript
const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  2xl: '3rem',    // 48px
};

// Usage
<div className="p-4">   // padding: 16px (md)
<div className="gap-3"> // gap: 12px (between md and lg)
```

### Typography

```typescript
const typography = {
  h1: {
    size: "2.25rem", // 36px
    weight: "bold", // 700
  },
  h2: {
    size: "1.875rem", // 30px
    weight: "bold",
  },
  h3: {
    size: "1.5rem", // 24px
    weight: "semibold",
  },
  body: {
    size: "1rem", // 16px
    weight: "normal",
  },
  small: {
    size: "0.875rem", // 14px
    weight: "normal",
  },
  tiny: {
    size: "0.75rem", // 12px
    weight: "normal",
  },
};
```

## 📊 Metrics & Analytics (Future)

```typescript
// Events to track
events = {
  // User actions
  'user:start_listening',
  'user:submit_feedback',
  'user:earn_credit',
  'user:share_track',

  // Listening behavior
  'listen:60s_reached',
  'listen:paused_at',
  'listen:seek_detected',
  'listen:buffering_detected',

  // Form interaction
  'form:feedback_started',
  'form:feedback_submitted',
  'form:feedback_cleared',

  // Track performance
  'track:viewed',
  'track:feedback_count',
  'track:avg_rating',
};

// Tracking code
analytics.track('user:submit_feedback', {
  trackId,
  trackTitle,
  feedbackLength: feedback.length,
  listeningTime: listeningState.totalListenedMs,
  timeToSubmit: Date.now() - trackLoadedAt,
});
```

## 🚀 Performance Optimizations

### Current (MVP)

```
✓ Done:
- Server Components where possible
- Image optimization (Spotify thumbs cached)
- Code splitting (Next.js automatic)
- CSS-in-JS (Tailwind compiled)

⚠️ Not needed for MVP:
- Database indexing
- API caching
- CDN
- Image resize service
```

### Future Optimizations

```typescript
// Image Optimization
<Image
  src={track.coverUrl}
  alt={track.title}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL={blurHash}
  priority={isCurrentTrack}
/>

// Lazy Loading
<TrackCard
  track={track}
  loading="lazy"
/>

// API Response Caching
revalidate: 3600 // ISR: revalidate every hour

// Database Queries
useQuery(['tracks'], fetchTracks, {
  staleTime: 5 * 60 * 1000, // 5 min
  gcTime: 10 * 60 * 1000,   // 10 min
});
```

## 🧪 Testing Strategy (Future)

```typescript
// Unit Tests
describe("useSpotifyTracker", () => {
  it("should track 60 seconds of real play time", () => {
    // Mock Spotify iFrame API
    // Simulate play/pause/seek
    // Assert totalListenedMs >= 60000
  });

  it("should ignore pauses", () => {
    // Simulate pause event
    // Assert timeDelta not added
  });

  it("should ignore big seeks", () => {
    // Simulate 20s seek
    // Assert positionDelta > 5000 ignored
  });
});

// Component Tests
describe("TrackCard", () => {
  it("should disable textarea until 60s", () => {
    // Mock hook with < 60s
    // Assert textarea disabled
    // Mock hook with 60s
    // Assert textarea enabled
  });
});

// Integration Tests
describe("Discover Flow", () => {
  it("should complete full listen -> feedback cycle", () => {
    // Render page
    // Simulate 60s listening
    // Type feedback
    // Submit
    // Assert credit earned
    // Assert next track loaded
  });
});

// E2E Tests
describe("Full User Journey", () => {
  it("submit track -> listen -> feedback -> credit", () => {
    // Go to /submit
    // Enter Spotify URL
    // See preview
    // Go to /discover
    // Listen 60s
    // Write feedback
    // Submit
    // See credit earned
  });
});
```

---

**Ce document aide à comprendre les choix architecturaux et facilite la maintenance future.**
