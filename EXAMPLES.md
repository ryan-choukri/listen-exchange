# ListenExchange - Tips & Exemples

## 🎯 Tester l'Application Localement

### 1. Lancer le serveur

```bash
npm run dev
```

Accès: http://localhost:3001

### 2. Tester Landing Page

```
URL: http://localhost:3001/
- Voir logo "ListenExchange"
- Cliquer "Start Listening" → /discover
- Cliquer "Submit a Track" → /submit
```

### 3. Tester Submit Page

```
URL: http://localhost:3001/submit

Exemple URL Spotify valide:
https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqLv

Étapes:
1. Coller URL dans input
2. Cliquer "Fetch Track Info"
3. Voir preview chargée (cover + titre)
4. Voir Spotify Embed
5. Cliquer "Add This Track"
```

### 4. Tester Discover Page

```
URL: http://localhost:3001/discover

Étapes:
1. Voir TrackCard avec cover
2. Voir Spotify Embed
3. Voir "0s / 60s" (time counter)
4. Textarea feedback est DÉSACTIVÉE
5. Bouton "Submit Feedback" est DÉSACTIVÉ
6. Voir "Listen for 60 seconds to unlock feedback"

Note: En localhost, iFrame peut être bloquée (ORB).
Tester en production pour vraie écoute.
```

### 5. Tester Feedback Form

```
Conditions à remplir:
- 60 secondes réelles écoutées (play time)
- Min 120 caractères dans textarea

À 60s:
- Textarea devient ENABLED
- Placeholder change: "What do you think..."
- Couleur border change (vert)

À 120 chars:
- Compteur devient vert
- Bouton "Submit Feedback" devient ENABLED

Submit:
- Feedback sauvegardé (state en mémoire)
- +1 crédit ajouté
- Track suivant chargé
- Historique mis à jour
```

## 💡 Hooks & Composants - Exemples d'Usage

### useSpotifyTracker

```typescript
import { useSpotifyTracker } from '@/app/hooks/useSpotifyTracker';

function MyComponent() {
  const {
    listeningState,      // { totalListenedMs, isPlaying, hasReached60Seconds }
    progressPercent,     // 0-100
    resetListening       // () => void
  } = useSpotifyTracker();

  return (
    <>
      <div>
        {Math.ceil(listeningState.totalListenedMs / 1000)}s listened
        (real time, no pauses/buffering/seeks)
      </div>

      <div style={{ width: `${progressPercent}%` }}>
        Progress bar
      </div>

      {listeningState.hasReached60Seconds && (
        <p>✓ Listening complete!</p>
      )}

      <button onClick={resetListening}>Reset</button>
    </>
  );
}
```

### Button Component

```typescript
import { Button } from '@/app/components/Button';

// Primary (default)
<Button onClick={handleClick}>Click me</Button>

// Secondary variant
<Button variant="secondary">Secondary</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Disabled
<Button disabled>Disabled</Button>

// Custom class
<Button className="custom-class">With custom styles</Button>
```

### Input Component

```typescript
import { Input } from '@/app/components/Input';

// Basic
<Input
  placeholder="Enter URL..."
  value={url}
  onChange={(e) => setUrl(e.target.value)}
/>

// With label
<Input
  label="Spotify URL"
  placeholder="https://..."
/>

// With error
<Input
  label="URL"
  error="Invalid Spotify URL"
  value={url}
  onChange={(e) => setUrl(e.target.value)}
/>

// With helper text
<Input
  label="URL"
  helperText="Paste a direct track link from Spotify"
/>
```

### TrackCard Component

```typescript
import { TrackCard } from '@/app/components/TrackCard';

const track: Track = {
  id: '4cOdK2wGLETKBW3PvgPWqLv',
  title: 'Blinding Lights',
  coverUrl: 'https://...',
  spotifyUrl: 'https://open.spotify.com/track/...',
  embedHtml: '<iframe src="..."></iframe>'
};

<TrackCard
  track={track}
  onFeedbackSubmit={(feedback) => {
    console.log('Feedback submitted:', feedback);
    // Save to DB, award credits, etc.
  }}
  isSubmitting={isLoading}
/>
```

## 🔌 API oEmbed - Exemples

### Request

```bash
curl "http://localhost:3001/api/oembed?url=https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqLv"
```

### Response

```json
{
  "title": "Blinding Lights",
  "thumbnail_url": "https://i.scdn.co/image/...",
  "thumbnail_width": 640,
  "thumbnail_height": 640,
  "version": "1.0",
  "provider_name": "Spotify",
  "provider_url": "https://www.spotify.com",
  "html": "<iframe style=\"border-radius:12px\" src=\"https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqLv\" width=\"100%\" height=\"152\" frameBorder=\"0\" allowFullScreen=\"\" allow=\"autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture\"></iframe>",
  "width": 300,
  "height": 380,
  "trackId": "4cOdK2wGLETKBW3PvgPWqLv",
  "spotifyUrl": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqLv"
}
```

## 🧪 Test Scenarios

### Scenario 1: Full User Journey

```
1. User lands on /
2. Clicks "Start Listening"
3. Redirected to /discover
4. Sees track 1 with Spotify embed
5. Starts playing on Spotify player
6. App tracks real time (no pause/buffering)
7. At 60s: Feedback form unlocks
8. User types 120+ char feedback
9. Clicks "Submit Feedback"
10. Gets +1 credit
11. Sees track 2
12. Repeat for track 3
13. Message: "Great! 3 feedbacks submitted. 3 credits earned!"
```

### Scenario 2: Artist Submission

```
1. Artist lands on /
2. Clicks "Submit a Track"
3. Redirected to /submit
4. Pastes Spotify URL
5. Clicks "Fetch Track Info"
6. Sees preview with cover + embed
7. Clicks "Add This Track"
8. Alert: "Track submitted! (MVP version)"
9. Can submit another track
```

### Scenario 3: Edge Cases

#### URL Validation

```
✓ Valid: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqLv
✗ Invalid: https://open.spotify.com/album/...
✗ Invalid: spotify:track:... (URI format)
✗ Invalid: not-a-url
Error message: "Invalid Spotify track URL"
```

#### Feedback Validation

```
✓ Valid: "This is a great track, I really enjoyed..." (120+ chars)
✗ Invalid: "Good!" (5 chars)
Message: "119 more needed"

Conditions:
- Before 60s: Textarea disabled "Listen for 60 seconds to unlock"
- Before 120 chars: Button disabled "119 more needed"
- After 60s + 120 chars: Button enabled "Submit Feedback"
```

## 🚀 Future Enhancements

### Phase 2: Database Integration

```typescript
// New types
interface User {
  id: string;
  email: string;
  credits: number;
  createdAt: Date;
}

interface Track {
  id: string;
  spotifyId: string;
  spotifyUrl: string;
  title: string;
  coverUrl: string;
  submittedBy: string;
  submittedAt: Date;
  active: boolean;
}

interface Feedback {
  id: string;
  trackId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

// New endpoints needed
POST /api/auth/signup
POST /api/auth/login
GET /api/user/profile
POST /api/tracks (submit)
GET /api/tracks (discover queue)
POST /api/feedback (submit)
GET /api/user/credits
```

### Phase 2: Authentication

```typescript
// Add auth context
const [user, setUser] = useState<User | null>(null);

// Protect routes
if (!user) return <Navigate to="/login" />;

// Track submission flow
POST /api/tracks/submit
  - Verify user logged in
  - Save track to DB
  - Add to discovery queue
  - Email confirmation
```

### Phase 2: Persist Data

```typescript
// Replace mock data with API calls
const [tracks, setTracks] = useState<Track[]>([]);

useEffect(() => {
  fetch("/api/tracks/queue")
    .then((r) => r.json())
    .then((data) => setTracks(data));
}, []);

// Save feedback
async function handleFeedbackSubmit(feedback: string) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    body: JSON.stringify({
      trackId: currentTrack.id,
      content: feedback,
      userId: user.id,
    }),
  });

  if (res.ok) {
    // Award credit
    // Update user credits
    // Move to next track
  }
}
```

## 🐛 Debugging Tips

### Spotify Embed Not Loading

```javascript
// Check console for errors
// ORB (Origin Resource Block) common in localhost

// To test with real embed:
1. Deploy to HTTPS (Vercel)
2. Or use production domain

// Check iframe URL is valid
console.log(track.embedHtml);
// Should contain: <iframe src="https://open.spotify.com/embed/track/..."
```

### Listening Time Not Incrementing

```javascript
// Check useSpotifyTracker hook
const { listeningState } = useSpotifyTracker();
console.log(listeningState);
// Should show totalListenedMs increasing

// Check Spotify iFrame API loaded
console.log(window.onSpotifyIframeApiReady);
// Should be defined after Spotify script loads

// Check isPaused status
// If true, time won't accumulate (intentional)
```

### Form Not Validating

```javascript
// Check character count
console.log(feedback.length);
// Should be >= 120 for submit button to enable

// Check listening time
console.log(listeningState.hasReached60Seconds);
// Should be true after 60s real time

// Both conditions must be true for button
const canSubmit = listeningState.hasReached60Seconds && charCount >= 120;
```

## 📊 Mock Data Reference

### 3 Mock Tracks in /discover

```typescript
{
  id: '4cOdK2wGLETKBW3PvgPWqLv',
  title: 'Blinding Lights - The Weeknd',
  coverUrl: 'https://i.scdn.co/image/ab67616d0000b2732a1c745d1c34ac515b5fe738',
  spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqLv'
}

{
  id: '11dFghVXANMlKmJXsNCQvb',
  title: 'As It Was - Harry Styles',
  coverUrl: 'https://i.scdn.co/image/ab67616d0000b27377a20f94c8c82909fa217e62',
  spotifyUrl: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCQvb'
}

{
  id: '6rqhFgbbKwnb9MLmUQDvDm',
  title: 'Heat Waves - Glass Animals',
  coverUrl: 'https://i.scdn.co/image/ab67616d0000b273e40c89cbb80e3616e27231ee',
  spotifyUrl: 'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDvDm'
}
```

---

**Happy coding! 🎵**
