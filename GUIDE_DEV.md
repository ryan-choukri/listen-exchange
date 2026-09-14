# ListenExchange MVP - Guide Développeur

## 🚀 Quick Start

```bash
# Installation
npm install

# Dev
npm run dev
# → http://localhost:3001

# Build
npm run build

# Production
npm start
```

## 📁 Structure du Projet

```
app/
├── api/
│   └── oembed/
│       └── route.ts           # API pour récupérer infos Spotify
├── components/
│   ├── Button.tsx             # Composant bouton réutilisable
│   ├── Input.tsx              # Composant input réutilisable
│   └── TrackCard.tsx          # Composant principal d'écoute
├── hooks/
│   └── useSpotifyTracker.ts   # Hook pour tracker 60 secondes réelles
├── types/
│   └── spotify.ts             # Types TypeScript
├── discover/
│   └── page.tsx               # Page d'écoute
├── submit/
│   └── page.tsx               # Page de soumission
├── page.tsx                   # Landing page
├── layout.tsx                 # Layout root
└── globals.css                # Styles globaux
```

## 🎵 Logique Spotify - Points Clés

### useSpotifyTracker Hook

Le hook gère le tracking de 60 secondes de temps **réel** écouté:

```typescript
const { listeningState, progressPercent, resetListening } = useSpotifyTracker();

// Retourne:
// - totalListenedMs: temps réellement écouté
// - isPlaying: est-ce qu'on joue?
// - hasReached60Seconds: seuil atteint?
// - progressPercent: % pour la progress bar
```

#### Algorithme de tracking:

1. **Écoute les événements Spotify iFrame API**
   - `onSpotifyIframeApiReady` → initialise le listener
   - Met à jour position/duration/isPaused/isBuffering

2. **Filtre le temps réel**

   ```
   - ✓ Ajoute le delta de temps si:
     - Musique en cours de lecture (!isPaused && !isBuffering)
     - Delta < 5 secondes (évite compter les gros seeks)
     - Au moins 100ms écoulées

   - ✗ N'ajoute PAS si:
     - Paused = true
     - Isuffering = true
     - Seek détecté (delta > 5s)
   ```

3. **Accumule le temps**
   ```
   totalListenedMs += timeDelta
   hasReached60Seconds = totalListenedMs >= 60000
   ```

### Intégration dans TrackCard

```tsx
<TrackCard
  track={track}
  onFeedbackSubmit={(feedback) => {
    /* handle... */
  }}
  isSubmitting={false}
/>
```

Le composant:

- Initialise le hook
- Affiche la progress bar
- Déverrouille le feedback après 60s
- Valide min 120 caractères
- Affiche le temps réel écouté

## 🔌 API oEmbed

**Endpoint:** `GET /api/oembed?url={spotifyUrl}`

```typescript
// Input
?url=https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqLv

// Output
{
  title: "Blinding Lights",
  thumbnail_url: "https://...",
  thumbnail_width: 640,
  thumbnail_height: 640,
  html: "<iframe src=\"...\"></iframe>",
  width: 300,
  height: 380,
  trackId: "4cOdK2wGLETKBW3PvgPWqLv",
  spotifyUrl: "https://open.spotify.com/track/..."
}
```

## 📊 Flux Utilisateur

### Landing (`/`)

```
[Hero] "ListenExchange"
  ↓
  [Start Listening] → /discover
  [Submit a Track] → /submit
```

### Submit (`/submit`)

```
[Paste URL] → [Fetch Track Info]
  ↓
[Preview: Cover + Title]
  ↓
[Spotify Embed]
  ↓
[Add This Track]
```

### Discover (`/discover`)

```
[Track 1 of 3]
  ↓
[Cover] + [Spotify Embed]
  ↓
[Play for 60s real time...]
  (Progress: 0s/60s, isPlaying: true)
  ↓
[60s reached! ✓]
  ↓
[Textarea unlocked]
  ↓
[Type feedback... 120 chars min]
  ↓
[Submit Feedback]
  ↓
[+1 credit earned]
  ↓
[Next track]
```

## 🎨 Design System

### Couleurs

- **Background:** `#0a0a0a` (gris très foncé)
- **Text:** `#ededed` (gris très clair)
- **Primary:** `#22c55e` (vert Spotify)
- **Secondary:** `#64748b` (gris)
- **Error:** `#ef4444` (rouge)
- **Borders:** `rgba(255,255,255,0.1)`

### Composants

- **Button:** `px-4 py-2.5 rounded-lg`
- **Input:** `px-4 py-2.5 border rounded-lg`
- **Card:** `rounded-lg shadow-lg overflow-hidden`
- **Progress:** `bg-gray-300 rounded-full h-2`

## 🔄 État Global (MVP)

Pour l'MVP, l'état est local:

- **Credits:** stocké dans le state `/discover`
- **Feedback:** dans un array en mémoire
- **Tracks:** mockées (données statiques)

**Prochaine étape:** Ajouter Supabase

## 🧪 Testing Spotify Embed

Pour tester le Spotify Embed:

1. Aller sur https://open.spotify.com/
2. Copier un lien de track
3. Aller sur `/submit`
4. Coller le lien et "Fetch Track Info"
5. L'embed s'affiche
6. Aller sur `/discover` pour écouter

**Note:** En localhost, l'iFrame peut être bloquée par ORB. Sur production (https), ça fonctionne.

## 📦 Dépendances

- **next:** 16.3.5 (avec Turbopack)
- **react:** 19.2.8
- **react-dom:** 19.2.8
- **tailwindcss:** 4.x
- **typescript:** 5.x

## 🚀 Next Steps (Post-MVP)

1. **Database (Supabase)**
   - Tables: users, tracks, feedback
   - Authentification

2. **Features**
   - Persistance des données
   - Historique utilisateur
   - Système de crédits avancé

3. **Optimisations**
   - Image optimization
   - Code splitting
   - Analytics

## 🐛 Debugging

### Spotify Embed ne charge pas

- En localhost: normal (ORB blocker)
- En production: vérifier headers CORS
- Vérifier la URL Spotify valide

### Temps d'écoute ne s'incrémente pas

- Vérifier console (Web Vitals)
- Vérifier que Spotify iFrame API chargée
- Vérifier isPaused/isBuffering statut

### Feedback ne se valide pas

- Min 120 caractères strict
- 60 secondes réelles (pas juste position)
- Vérifier charCount !== undefined
