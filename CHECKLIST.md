# ListenExchange MVP - Checklist d'Implémentation

## ✅ Features Demandées

### Pages

- [x] `/` - Landing page
  - [x] Logo texte "ListenExchange"
  - [x] Tagline découverte musicale + feedback
  - [x] Bouton "Start listening" → /discover
  - [x] Bouton "Submit a track" → /submit
  - [x] Design dark theme moderne

- [x] `/submit` - Soumission de track
  - [x] Input URL Spotify
  - [x] Validation basique URL
  - [x] Appel côté serveur API oEmbed
  - [x] Affichage titre
  - [x] Affichage cover (thumbnail)
  - [x] Spotify Embed
  - [x] Bouton "Add this track"

- [x] `/discover` - Découverte + feedback
  - [x] TrackCard composant réutilisable
  - [x] Pochette album
  - [x] Titre du morceau
  - [x] Spotify Embed
  - [x] Progress bar "Listen for 60 seconds"
  - [x] Compteur temps réellement écouté
  - [x] Textarea feedback
  - [x] Textarea désactivée jusqu'à 60s
  - [x] Compteur de caractères
  - [x] Minimum 120 caractères validé
  - [x] Bouton "Submit feedback"
  - [x] Bouton désactivé si conditions pas remplies

### Spotify Integration

- [x] oEmbed pour récupérer infos publiques
  - [x] Endpoint API `/api/oembed`
  - [x] Validation URL Spotify
  - [x] Récupération title
  - [x] Récupération cover/thumbnail
  - [x] Récupération HTML embed
  - [x] Gestion erreurs

- [x] iFrame API pour suivi de lecture
  - [x] Écoute `onSpotifyIframeApiReady`
  - [x] Listener sur changements playback
  - [x] Accès `playingURI`
  - [x] Accès `isPaused`
  - [x] Accès `isBuffering`
  - [x] Accès `position`
  - [x] Accès `duration`

### Algorithme Temps Réel (IMPORTANT)

- [x] Comptabilise temps réellement écouté
  - [x] ✓ Ignore les pauses
  - [x] ✓ Ignore le buffering
  - [x] ✓ Ignore gros seeks (> 5 secondes)
  - [x] ✓ Vérifie position delta < 5s
  - [x] ✓ Vérifie time delta > 100ms
  - [x] ✓ Accumule uniquement temps play réel
  - [x] ✓ Détecte quand 60 secondes atteint

### Feedback Form

- [x] Textarea feedback
  - [x] Désactivée jusqu'à 60s
  - [x] Compteur caractères live
  - [x] Minimum 120 caractères
  - [x] Bouton Submit désactivé si < 120
  - [x] Placeholder informatif

### Crédits System

- [x] +1 crédit par feedback validé
- [x] Affichage compteur crédits
- [x] Historique feedbacks
- [x] Mock data pour MVP

### Architecture

- [x] Composants réutilisables
  - [x] `<Button>` (variant, size)
  - [x] `<Input>` (label, error, helper)
  - [x] `<TrackCard>` (principale)

- [x] Hooks dédiés
  - [x] `useSpotifyTracker` (isolé)

- [x] Types TypeScript
  - [x] `SpotifyOEmbedResponse`
  - [x] `Track`
  - [x] `ListeningState`
  - [x] `SpotifyPlaybackUpdate`

- [x] Route API Next.js
  - [x] `/api/oembed`
  - [x] TypeScript
  - [x] Gestion erreurs

- [x] Pas de base de données MVP
- [x] Données mockées pour /discover

### Design

- [x] Moderne & simple
- [x] Orientation musique indépendante
- [x] Pas de SaaS générique
- [x] Grande pochette
- [x] Lecteur Spotify bien intégré
- [x] Progression écoute très visible
- [x] Feedback au centre
- [x] Responsive mobile
- [x] Dark theme
- [x] Spotify green accent (#22c55e)
- [x] Gradients & transitions

### Stack Technical

- [x] Next.js 16.3.5 App Router
- [x] TypeScript strict mode
- [x] Tailwind CSS 4
- [x] React 19.2.8
- [x] React Hooks modernes

### Flow Fonctionnel Complet

- [x] Spotify URL → oEmbed → Embed → 60s tracking → feedback 120 chars
  - [x] Input URL page submit
  - [x] Validation URL
  - [x] Appel `/api/oembed`
  - [x] Affichage preview
  - [x] "Add this track" (mock)
  - [x] Navigation vers discover
  - [x] Spotify Embed chargement
  - [x] iFrame API listener init
  - [x] Tracking temps réel (sans pause/buffering/seek)
  - [x] Progress bar update
  - [x] À 60s: form débloqué
  - [x] Input feedback minimal 120 chars
  - [x] Bouton submit activé
  - [x] Submit → +1 crédit
  - [x] Historique affichage

## 📊 Statistiques Implémentation

### Fichiers Créés: 11

- 3 pages (.tsx)
- 3 composants (.tsx)
- 1 hook (.ts)
- 1 type (.ts)
- 1 API route (.ts)
- 2 docs (.md)

### Lignes de Code: ~2000

- **Frontend:** ~1400
- **API:** ~80
- **Hooks:** ~220
- **Types:** ~50

### Composants: 3

- Button (réutilisable)
- Input (réutilisable)
- TrackCard (spécialisé)

### Hooks: 1

- useSpotifyTracker (complexe)

### Routes: 4

- GET / (landing)
- GET /submit (form)
- GET /discover (listener)
- GET /api/oembed (API)

### Intégrations Externes: 1

- Spotify oEmbed API

## 🎯 Validation des Critères

### ✅ Critères Fonctionnels

- [x] URL Spotify → Infos récupérées (oEmbed)
- [x] Embed Spotify affichage
- [x] 60 secondes écoute réelle trackée (smart algo)
- [x] Feedback min 120 chars
- [x] Crédits gagnés
- [x] UI débloquée progressivement

### ✅ Critères Techniques

- [x] TypeScript strict
- [x] Composants modulaires
- [x] Hooks isolés
- [x] API Next.js
- [x] Tailwind responsive
- [x] Build produit sans erreur
- [x] Dev server lance sans erreur

### ✅ Critères Design

- [x] Modern mais simple
- [x] Musique indépendante vibe
- [x] Pas SaaS générique
- [x] Pochette large
- [x] Lecteur intégré
- [x] Feedback central
- [x] Mobile responsive

### ✅ Critères MVP

- [x] Frontend implémenté
- [x] Logique Spotify fonctionnelle
- [x] Sans Supabase
- [x] Données mockées
- [x] Complet et testable

## 🚀 Prêt pour Prochaine Phase

- [ ] Intégration Supabase
- [ ] Authentification utilisateurs
- [ ] Persistance données
- [ ] DB schema (users, tracks, feedback)
- [ ] Profiles utilisateurs
- [ ] Système de soumission réel
- [ ] Persistance crédits
