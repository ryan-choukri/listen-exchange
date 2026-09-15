# UI Allocation de Crédits - Guide d'Utilisation

## 📍 Localisation

La nouvelle UI d'allocation de crédits se trouve sur la page **Dashboard** (`/dashboard`), dans le composant **"Your Submitted Tracks"**.

---

## 🎨 Composants Créés

### 1. **CreditAllocationModal.tsx** (Nouveau)

Modal intuitif pour l'allocation de crédits.

**Localisation:** `app/components/CreditAllocationModal.tsx`

**Fonctionnalités:**

- ✅ Affiche le solde de crédits disponibles
- ✅ Affiche le statut actuel de la track (Active/Pending)
- ✅ Affiche les crédits restants
- ✅ Boutons rapides de sélection (+1, +5, +10)
- ✅ Validation en temps réel (affiche si l'utilisateur a assez de crédits)
- ✅ Préview du solde après allocation
- ✅ Messages d'erreur clairs
- ✅ Info-tip sur le fonctionnement des crédits

**Props:**

```typescript
interface CreditAllocationModalProps {
  trackId: string; // UUID de la track
  trackTitle: string; // Titre pour l'affichage
  currentCredits: number; // Crédits restants actuels
  currentStatus: string; // 'active' ou 'pending'
  isOpen: boolean; // Contrôle visibilité du modal
  onClose: () => void; // Callback fermeture
  onSuccess: () => void; // Callback succès (rafraîchit la liste)
}
```

---

### 2. **UserSubmittedTracksList.tsx** (Modifié)

Composant de liste des tracks soumises avec nouvelle UI.

**Localisation:** `app/components/UserSubmittedTracksList.tsx`

**Changements:**

- ✅ Affiche maintenant les crédits restants par track
- ✅ Affiche le statut de la track (badge Active/Pending)
- ✅ Bouton "Allocate" pour ouvrir le modal
- ✅ Layout amélioré pour mobile (flex-col sur petit écran)
- ✅ Couleurs visuelles pour statuts (vert = active, gris = pending)

**Structure visuelle (desktop):**

```
┌─ Cover ─ Title / Date ─ Status Badge ─ Credits ─ [Allocate] [Delete] ─┐
│                                                                        │
│  [Track Image]  My Track                 Active    5 credits         │
│                 2025-09-15               [·····]   [·······]  [····] │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Structure visuelle (mobile):**

```
┌─────────────────────────────────────┐
│                                     │
│  [Track]  My Track                 │
│  Image    2025-09-15               │
│                                     │
│  Active    5 credits               │
│  [····]    [········]  [···][····] │
│  [Allocate] [Delete]               │
│                                     │
└─────────────────────────────────────┘
```

---

## 📱 Flux Utilisateur Complet

### Étape 1: Naviguer au Dashboard

```
1. User connecté clique sur "Dashboard" dans la Navbar
2. Page affiche les statistiques et la liste "Your Submitted Tracks"
3. Chaque track affiche son statut et ses crédits
```

### Étape 2: Ouvrir le Modal

```
1. User voit sa track: "Midnight Echoes" (Pending, 0 credits)
2. Clique sur bouton vert "Allocate"
3. Modal s'ouvre avec:
   - Titre: "Allocate Credits"
   - Track name: "Midnight Echoes"
   - Current status: Pending
   - Credits remaining: 0
   - Your available credits: 12
```

### Étape 3: Sélectionner le Montant

**Option A - Saisir manuellement:**

```
1. Input: "5" (dans le champ "Credits to Allocate")
2. Preview montre:
   - Your Balance: 12 credits
   - Will Allocate: -5
   - After Allocation: 7
```

**Option B - Boutons rapides:**

```
1. Cliquer "+5"
2. Input auto-rempli avec "5"
3. Preview montre le nouveau solde
```

### Étape 4: Valider et Allouer

```
1. Bouton "Allocate" vert devient actif (si montant valide et affordable)
2. Click "Allocate"
3. Button passe à "Allocating..." (état de chargement)
4. Si succès:
   ✅ Modal ferme
   ✅ Liste se rafraîchit
   ✅ Track passe: Pending → Active
   ✅ Crédits: 0 → 5
   ✅ Solde utilisateur: 12 → 7
```

---

## 🛡️ Validations Frontend

### Avant d'allouer, le système vérifie:

```
✓ Montant > 0
✓ Montant <= solde disponible
✓ Track existe
✓ User propriétaire de la track
```

### Messages d'erreur:

```
❌ "Please enter a valid positive number"
   → L'utilisateur a saisi 0 ou un nombre négatif

❌ "Insufficient credits. You have 2 but need 5"
   → L'utilisateur n'a pas assez de crédits

❌ "[Message de Supabase]"
   → Erreur serveur (ex: propriété track, etc.)
```

---

## 💾 Intégrations Backend

### Server Actions Utilisées:

```typescript
// Obtenir les tracks avec crédits
await getUserSubmittedTracks()
  → returns: [{id, title, credits_remaining, status, ...}]

// Allouer des crédits
await allocateTracksCredits(trackId, amount)
  → returns: {success, message, credits_balance, credits_remaining, status}

// Obtenir solde utilisateur
await getUserCredits()
  → returns: number (solde en crédits)
```

### Flux Supabase:

```
Frontend: "Allocate 5 credits to Track X"
  ↓
Backend: allocateTracksCredits(track_uuid, 5)
  ↓
RPC: allocate_track_credits(track_uuid, 5)
  ↓
Database:
  1. Vérify user auth + propriété
  2. UPDATE profiles.credits -= 5
  3. UPDATE submitted_tracks.credits_remaining += 5
  4. UPDATE submitted_tracks.status = 'active'
  5. INSERT credit_transactions
  ↓
Return: {success: true, credits_balance: 7, credits_remaining: 5, ...}
  ↓
Frontend: Ferme modal, rafraîchit liste
```

---

## 🎨 Styles et Couleurs

### Status Badges

```
Active:  🟢 vert    bg-green-500/20  border-green-500  text-green-300
Pending: ⚫ gris    bg-gray-500/20   border-gray-500   text-gray-300
```

### Bottons

```
Allocate:  🟢 vert   bg-green-600 hover:bg-green-700
Delete:    🔴 rouge  bg-red-500/20 hover:bg-red-500/30
Cancel:    ⚫ gris   bg-gray-700 hover:bg-gray-600
```

### Backgrounds

```
Modal:      bg-gray-800 border-gray-700
Status box: bg-gray-700/50 border-gray-600
Balance:    bg-green-500/10 border-green-500/30  (votre solde)
Info:       bg-blue-500/10 border-blue-500/30    (conseil)
Error:      bg-red-500/20 border-red-500         (erreur)
```

---

## ✨ Cas d'Usage

### Cas 1: Premier crédit (statut = Pending)

```
Utilisateur vient de soumettre une track
Track: "New Song" | Status: Pending | Credits: 0
↓
Click "Allocate"
↓
Modal: "You have 10 credits available"
↓
Allocate 3 credits
↓
Track devient Active, Discover le montrera aux autres
```

### Cas 2: Rajouter des crédits (statut = Active)

```
Track existante: "My Track" | Status: Active | Credits: 2 (1 restant)
↓
Feedback auteur a consommé 1 crédit (2 - 1 = 1)
↓
Click "Allocate"
↓
Allocate 5 crédits de plus
↓
Track: Credits now 6 (1 + 5)
↓
Découvrir continues to show le track
```

### Cas 3: Pas assez de crédits

```
Utilisateur a 2 crédits
Track: "Song" | Status: Pending | Credits: 0
↓
Click "Allocate"
↓
Input: 5
↓
Error: "Insufficient credits. You have 2 but need 5"
↓
Input: 2
↓
Success ✅
```

---

## 📊 État du Composant

Le modal maintient plusieurs états:

```typescript
// Inside CreditAllocationModal
const [amount, setAmount] = useState<string>("1"); // Montant saisi
const [isLoading, setIsLoading] = useState(false); // Pendant allocation
const [error, setError] = useState<string | null>(null); // Msg d'erreur
const [userBalance, setUserBalance] = useState<number | null>(null); // Solde
```

Le composant list maintient:

```typescript
// Inside UserSubmittedTracksList
const [tracks, setTracks] = useState<SubmittedTrack[]>([]); // List tracks
const [selectedTrack, setSelectedTrack] = useState<SubmittedTrack | null>(null); // Track en allocation
const [isModalOpen, setIsModalOpen] = useState(false); // Visibility modal
```

---

## 🔄 Rafraîchissement Après Allocation

Quand l'allocation réussit:

```
1. Modal détecte success
2. Appelle callback onSuccess()
3. UserSubmittedTracksList recharge les données
4. getUserSubmittedTracks() fetch la DB
5. Track s'affiche avec:
   - Status: active (couleur verte)
   - Credits: montant alloué
6. Modal ferme automatiquement
```

---

## 🧪 Test Manual

### Test 1: Allocation simple

```
1. Login dashboard
2. Voir track avec 0 credits, status pending
3. Click Allocate
4. Modal montre solde correct
5. Input 5 credits
6. Click Allocate
7. Voir: Track → 5 credits, active ✅
8. Vérifier dans /discover: track visible (active + credits > 0)
```

### Test 2: Erreur insuffisant crédits

```
1. Avoir <2 credits
2. Click Allocate
3. Input 5
4. Click Allocate
5. Voir: Error message "Insufficient..." ✅
6. Input solde maximal (ex: 1)
7. Click Allocate
8. Succès ✅
```

### Test 3: Mobile responsif

```
1. Ouvrir dashboard sur téléphone
2. List: tracks en column layout (images en haut)
3. Buttons: allocate/delete côte à côte
4. Modal: width 100% avec padding
5. Click allocate → modal s'affiche fullscreen
6. Saisir crédit et allouer
7. Voir succès et modal ferme
```

---

## 📝 Fichiers Modifiés

```
✅ app/components/CreditAllocationModal.tsx      [NOUVEAU]
✅ app/components/UserSubmittedTracksList.tsx    [MODIFIÉ]
✅ app/actions/submit.ts                        [MODIFIÉ - getUserSubmittedTracks()]
```

**Taille des changements:**

- CreditAllocationModal: ~240 lignes (nouveau)
- UserSubmittedTracksList: +65 lignes, restructuré pour layout
- getUserSubmittedTracks: +2 champs SELECT (credits_remaining, status)

---

## 🔐 Sécurité

✅ **Frontend validation:** Montants, checks solde
✅ **Backend RPC:** Authentification, propriété, vérifications
✅ **DB Constraints:** CHECK credits >= 0
✅ **RLS:** Utilisateurs ne peuvent allouer que leurs propres tracks
✅ **Atomic:** Tout ou rien au niveau PostgreSQL

---

## 📈 Performance

- Modal: Lazy loading du solde (au 1er open)
- Liste: Rechargement complet après allocation (léger et rapide)
- Pas de polling: Rafraîchissement via callback
- Images: Optimisation possible avec Next.js Image (future)

---

## 🚀 Prochaines Améliorations Possibles

- [ ] Historique des transactions dans le dashboard
- [ ] Confirmation toast après allocation réussie
- [ ] Animation transition status pending → active
- [ ] Estimation des feedbacks gagnables (5 credits = 5 feedbacks potentiels)
- [ ] Intégration avec Next.js Image pour les covers
- [ ] Dark/Light mode toggle
- [ ] Internationalization (FR/EN)
