# Système de Crédits - Documentation Complète

## 📋 Résumé des Modifications

### 1. Tables Modifiées

#### **`profiles`**

```sql
ALTER TABLE profiles
ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);
```

- Colonne existante `credits` renommée et utilisée comme `credits_balance` conceptuellement
- Ajout d'une contrainte CHECK pour empêcher les crédits négatifs
- Politique RLS stricte: les utilisateurs ne peuvent plus modifier directement

#### **`submitted_tracks`**

```sql
ALTER TABLE submitted_tracks
ADD COLUMN credits_remaining INTEGER NOT NULL DEFAULT 0,
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending'));
```

- `credits_remaining`: Nombre de crédits toujours disponibles pour cette track
- `status`: 'active' (accepte les feedbacks) ou 'pending' (inactive)
- Indeces: `idx_submitted_tracks_status`, `idx_submitted_tracks_active_credits`
- Contrainte: `credits_remaining_non_negative CHECK (credits_remaining >= 0)`

---

### 2. Nouvelle Table: `credit_transactions`

Audit trail complet de tous les mouvements de crédits.

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  track_id UUID REFERENCES submitted_tracks(id),
  feedback_id UUID REFERENCES track_feedbacks(id),
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('feedback_reward', 'track_allocation', 'refund')),
  description TEXT,
  created_at TIMESTAMP
);
```

**Types de transactions:**

- `feedback_reward`: Utilisateur reçoit +1 crédit pour un feedback valide
- `track_allocation`: Utilisateur alloue des crédits à sa track (montant négatif)
- `refund`: Remboursement (rare)

**Exemple de flux:**

```
Ryan (utilisateur 1):
  ✓ -5 credits    | track_allocation   | Track A
  ✓ Id= track-123 | credits_remaining: 5

Alice (utilisateur 2):
  ✓ +1 credit     | feedback_reward    | Track A
  ✓ feedback_id=xyz

Track A:
  ✓ credits_remaining: 5 → 4
  ✓ status: active (tant que > 0)
```

**RLS:** Utilisateurs ne peuvent lire que leurs propres transactions

---

### 3. RPC/Fonctions Créées ou Modifiées

#### **`allocate_track_credits(track_id UUID, amount INTEGER)`**

**Signature:** Returns `(success, message, credits_balance, credits_remaining, status)`

**Logique:**

1. Vérifier utilisateur authentifié via `auth.uid()`
2. Valider amount > 0
3. Récupérer la track et vérifier que l'utilisateur en est propriétaire
4. Vérifier l'utilisateur a assez de crédits
5. **Atomiquement:**
   - `profiles.credits -= amount`
   - `submitted_tracks.credits_remaining += amount`
   - `submitted_tracks.status = 'active'` (si credits > 0)
   - INSERT transaction `track_allocation`

**Sécurité:**

- ✅ Utilise `auth.uid()` jamais de user_id du frontend
- ✅ Vérif propriété track
- ✅ Vérif solde suffisant
- ✅ ACID: tout ou rien
- ❌ Pas de `SECURITY DEFINER` inutile

#### **`submit_track_feedback(track_id TEXT, feedback TEXT)` - MODIFIÉE**

**Signature:** Returns `(success, feedback_id, message, new_credits)`

**Nouvelles vérifications:**

1. Vérifier utilisateur authentifié
2. Vérifier feedback valide (3-2000 chars, pas de duplicate)
3. **SI la track existe dans `submitted_tracks`:**
   - ✗ Utilisateur ne peut pas feedback sa propre track
   - ✗ Track doit être `status = 'active'`
   - ✗ Track doit avoir `credits_remaining > 0`
4. Créer le feedback
5. **SI track existe:**
   - Retirer 1 crédit à `submitted_tracks.credits_remaining`
   - Donner +1 crédit à l'utilisateur qui feedback
   - Mettre track en `pending` si `credits_remaining = 0`
   - INSERT transaction `feedback_reward`
6. **SINON (track non-soumise):**
   - Juste donner +1 crédit (compatibilité)

**Atomicité:** Tout dans une transaction PostgreSQL, gère les race conditions

---

### 4. Règles de Sécurité (RLS)

#### **`profiles`**

- ✅ `SELECT`: Les utilisateurs ne peuvent lire que leur propre profil
- ✅ `INSERT`: Seul le trigger de signup insert
- ❌ `UPDATE`: Disabled (SECURITY DEFINER required via RPC only)
- ❌ `DELETE`: Disabled (ON DELETE CASCADE handled by FK)

#### **`submitted_tracks`**

- ✅ `SELECT`: Tous les utilisateurs authentifiés voient toutes les tracks
- ✅ `INSERT`: Utilisateurs insèrent uniquement leurs propres tracks
- ✅ `DELETE`: Utilisateurs suppriment uniquement leurs propres tracks
- ❌ `UPDATE`: Disabled (via RPC seulement)

#### **`track_feedbacks`**

- ✅ `SELECT`: Utilisateurs voient uniquement leurs propres feedbacks
- ❌ `INSERT/UPDATE/DELETE`: Disabled (via RPC seulement)

#### **`credit_transactions`**

- ✅ `SELECT`: Utilisateurs voient uniquement leurs propres transactions
- ❌ `INSERT/UPDATE/DELETE`: Disabled (via RPC seulement)

---

### 5. Fichiers Frontend Modifiés

#### **`app/actions/credits.ts` - NOUVEAU**

Exports:

- `allocateTracksCredits(trackId, amount)` → Allouer des crédits
- `getUserCredits()` → Récupérer solde actuellement
- `getTrackCredits(trackId)` → Info crédit d'une track
- `getUserCreditTransactions()` → Historique utilisateur
- `getTrackCreditHistory(trackId)` → Historique d'une track

**Pattern:**

```typescript
const result = await allocateTracksCredits(trackId, 5);
if (result.success) {
  console.log("Balance:", result.credits_balance);
  console.log("Track credits:", result.credits_remaining);
  console.log("Status:", result.status);
} else {
  console.error(result.message);
}
```

#### **`app/types/spotify.ts` - MODIFIÉ**

```typescript
interface Track {
  id: string;
  title: string;
  coverUrl: string;
  trackId: string;
  creditsRemaining?: number; // NOUVEAU
  status?: string; // NOUVEAU ('active' | 'pending')
}
```

#### **`app/actions/submit.ts` - MODIFIÉ**

`getSubmittedTracks()`:

- Filtre: `status = 'active' AND credits_remaining > 0`
- Retourne les nouveaux champs `credits_remaining`, `status`
- Reste: Exclut les tracks du user (inchangé)

#### **`app/discover/page.tsx` - MODIFIÉ**

Conversion Track:

```typescript
const convertedTracks: Track[] = submittedTracks.map((track) => ({
  id: track.id,
  title: track.title,
  coverUrl: track.cover_url,
  trackId: track.track_id,
  creditsRemaining: track.credits_remaining, // NOUVEAU
  status: track.status, // NOUVEAU
}));
```

---

### 6. Flux d'Utilisation Complet

#### **Allocation de Crédits (Submit Page)**

```
Utilisateur est sur /submit avec sa track
↓
Il clique "Allocate 5 Credits"
↓
Frontend: allocateTracksCredits(trackUUID, 5)
↓
RPC check:
  ✓ User auth (via auth.uid())
  ✓ Track owned by user
  ✓ User has >= 5 credits
  ✓ Amount > 0
↓
PostgreSQL TRANSACTION:
  - profiles.credits: 10 → 5
  - submitted_tracks.credits_remaining: 0 → 5
  - submitted_tracks.status: 'pending' → 'active'
  - INSERT credit_transactions (type: 'track_allocation', amount: -5)
↓
Frontend reçoit: success=true, credits_balance=5, credits_remaining=5, status='active'
↓
Utilisateur voir la track est maintenant ACTIVE dans son dashboard
```

#### **Feedback sur une Track Active (Discover Page)**

```
Utilisateur Alice sur /discover, track Track A visible (active, 5 credits)
↓
Elle écrit un feedback + clique "Submit"
↓
Frontend: submitTrackFeedback(spotifyTrackId, "Excellent track!")
↓
RPC check:
  ✓ User auth
  ✓ Feedback valide (3-2000 chars)
  ✓ Track "Track A" existe en submitted_tracks
  ✓ User != propriétaire (Ryan)
  ✓ Track status = 'active'
  ✓ credits_remaining > 0
  ✓ Pas de duplicate feedback
↓
PostgreSQL TRANSACTION:
  - track_feedbacks INSERT (user: Alice, track_id: '...', feedback: '...')
  - submitted_tracks.credits_remaining: 5 → 4
  - submitted_tracks.status: remain 'active' (4 > 0)
  - profiles.credits (Alice): 0 → 1
  - INSERT credit_transactions (user: Alice, type: 'feedback_reward', amount: +1)
↓
Frontend reçoit: success=true, new_credits=1
↓
Alice voit "+1 credit" notification
Ryan voit "4 credits remaining" sur Track A
```

#### **Dernier Crédit Consommé**

```
Track A: credits_remaining = 1
↓
Utilisateur Bob donne un feedback
↓
PostgreSQL TRANSACTION:
  - submitted_tracks.credits_remaining: 1 → 0
  - submitted_tracks.status: 'active' → 'pending'  // TRANSITION
  - profiles.credits (Bob): X → X+1
↓
Discover filtre par `status='active' AND credits_remaining > 0`
↓
Track A DISPARAÎT du Discover
↓
Track A devient pending dans le dashboard du propriétaire (Ryan)
```

---

### 7. Validation de la Sécurité

✅ **Pas de confiance au frontend:**

- `allocate_track_credits`: Reçoit juste (track_id, amount)
- L'utilisateur est obtenu via `auth.uid()` côté DB

✅ **Contrôle d'accès:**

- RLS sur toutes les tables
- Vérifications propriété track
- Vérification pas feedback sur propre track

✅ **Intégrité des données:**

- Contraintes CHECK (crédits >= 0)
- Contrainte UNIQUE sur feedbacks (user, track)
- Transactions atomiques

✅ **Audit trail:**

- Table `credit_transactions` immuable
- Chaque mouvement enregistré
- Query audit: `SELECT * FROM credit_transactions WHERE user_id = X`

✅ **Pas de bypass:**

- Utilisateurs ne peuvent pas UPDATE profiles directement
- Utilisateurs ne peuvent pas INSERT credit_transactions
- RPC SECURITY DEFINER utilisées seulement quand nécessaire

---

### 8. Parcours de Test Manuel

#### **Test 1: Allocation de crédits**

1. Login en tant qu'User A
2. Go to `/submit`
3. Submit une track (elle passe `pending`)
4. Dans le dashboard, voir: "0 credits allocated"
5. Cliquer "Allocate 5 Credits"
6. Vérifier:
   - ✓ Message de succès
   - ✓ Solde passe de 10 → 5 (si user a 10 crédits)
   - ✓ Track passe `pending` → `active`
   - ✓ Discover affiche la track

#### **Test 2: Feedback sur track active**

1. Login en tant qu'User A, allocate 5 credits
2. Logout, Login en tant qu'User B
3. Go to `/discover`
4. Voir la track de User A (active, 5 credits)
5. Cliquer "Feedback" sur cette track
6. Écrire un feedback
7. Vérifier:
   - ✓ Feedback submitted
   - ✓ User B crédits: 0 → 1
   - ✓ Track credits: 5 → 4
   - ✓ Track remain active
   - ✓ Dashboard User A: "4 credits remaining"

#### **Test 3: Dernier crédit**

1. Track A: 1 crédit remaining
2. User C donne un feedback
3. Vérifier:
   - ✓ User C crédits +1
   - ✓ Track A: 0 credits remaining
   - ✓ Track A status: `pending`
   - ✓ Track A DISPARAÎT du Discover
   - ✓ Découvrir page filtre `status='active' AND credits_remaining > 0`

#### **Test 4: Sécurité - pas feedback propre track**

1. User A submit + allocate track
2. User A try feedback sa propre track
3. Vérifier:
   - ✗ Error: "You cannot give feedback on your own track"
   - ✓ No credit awarded
   - ✓ No feedback created

#### **Test 5: Sécurité - pas assez de crédits**

1. User A have 2 crédits
2. Try allocate 5 crédits
3. Vérifier:
   - ✗ Error: "Insufficient credits. You have 2 but need 5"
   - ✓ No transaction

#### **Test 6: Historique transactions**

1. Go to dashboard / credit history page
2. Vérifier toutes les transactions:
   - ✓ Allocations (track_allocation, montant négatif)
   - ✓ Feedbacks reçus (feedback_reward, +1)
   - ✓ Timestamps corrects
   - ✓ Description explicite

---

### 9. Migrations Appliquées

1. **05_add_credits_to_tracks.sql**
   - ADD `credits_remaining`, `status` to `submitted_tracks`
   - Indeces et contraintes

2. **06_create_credit_transactions.sql**
   - Créer table `credit_transactions`
   - RLS: lecture proprio seulement

3. **07_create_allocate_credits_rpc.sql**
   - RPC `allocate_track_credits`
   - Atomicité, sécurité, vérifications

4. **08_update_submit_feedback_with_credits.sql**
   - Modify RPC `submit_track_feedback`
   - Intégration credits système
   - Vérif track active et crédits

5. **09_add_credit_constraints.sql**
   - Contrainte `CHECK credits >= 0`
   - RLS stricter sur profiles

**À appliquer à Supabase:**

```bash
supabase migration up
```

---

## Architecture Finale

```
Frontend (Next.js)
├─ /submit page
│  └─ allocateTracksCredits(trackId, amount)
├─ /discover page
│  └─ getSubmittedTracks() [filters active + credits > 0]
│  └─ submitTrackFeedback() [checks + transfers credits]
└─ /dashboard
   └─ getUserCredits()
   └─ getUserCreditTransactions()

Server Actions
├─ app/actions/credits.ts
│  ├─ allocateTracksCredits()
│  ├─ getUserCredits()
│  ├─ getTrackCredits()
│  └─ getUserCreditTransactions()
└─ app/actions/submit.ts
   └─ getSubmittedTracks() [modified]

Supabase (PostgreSQL)
├─ profiles
│  └─ credits (integer, >= 0)
├─ submitted_tracks
│  ├─ credits_remaining (integer, >= 0)
│  └─ status (active/pending)
├─ track_feedbacks
│  └─ [unchanged, used by feedback RPC]
└─ credit_transactions (audit trail)
   ├─ user_id
   ├─ track_id (nullable)
   ├─ feedback_id (nullable)
   ├─ amount
   └─ type (feedback_reward/track_allocation/refund)

RPC Functions
├─ allocate_track_credits(UUID, INTEGER)
│  └─ Atomique, vérifications, enregistre transaction
└─ submit_track_feedback(TEXT, TEXT) [modified]
   └─ Intègre checks track + transfer crédits
```

---

## Compatibilité

✅ Système existant reste 100% fonctionnel
✅ Discover affiche tracks sans crédits (mode legacy)
✅ Feedback sur tracks non-soumises donne quand même +1 crédit
✅ Pas de breaking changes
✅ Graduel: utilisateurs adoptent le système à leur rythme
