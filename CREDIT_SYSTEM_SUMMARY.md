# Système de Crédits - Résumé Implémentation

## 1. ✅ Tables Modifiées

### `profiles`

- Colonne existante `credits` conservée et utilisée comme `credits_balance`
- Ajout contrainte: `CHECK (credits >= 0)`
- RLS stricte: UPDATE disabled (sauf via RPC)

### `submitted_tracks`

- Colonne ajoutée: `credits_remaining INTEGER DEFAULT 0`
- Colonne ajoutée: `status TEXT ('active'|'pending') DEFAULT 'pending'`
- Indeces pour performance: `idx_submitted_tracks_status`, `idx_submitted_tracks_active_credits`
- Contrainte: `CHECK (credits_remaining >= 0)`

---

## 2. ✅ Table `credit_transactions` - NOUVELLE

Audit trail immutable de tous les mouvements:

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  track_id UUID REFERENCES submitted_tracks,  -- nullable
  feedback_id UUID REFERENCES track_feedbacks,  -- nullable
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('feedback_reward', 'track_allocation', 'refund')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Types:**

- `feedback_reward`: +1 crédit au feedback author
- `track_allocation`: -N crédit au propriétaire (allocation à track)
- `refund`: Remboursement (rare)

**RLS:** SELECT seulement propres transactions, pas de write direct

---

## 3. ✅ RPC/Fonctions

### `allocate_track_credits(track_id UUID, amount INTEGER)`

**Atomique**, sécurisé, enregistre transaction.

```
Input: track_id (UUID), amount (INTEGER > 0)

Vérifications:
  ✓ auth.uid() authentifié
  ✓ track existe
  ✓ user = track owner
  ✓ user.credits >= amount
  ✓ amount > 0

Transaction:
  1. profiles.credits -= amount
  2. submitted_tracks.credits_remaining += amount
  3. submitted_tracks.status = 'active' (si credits > 0)
  4. INSERT credit_transactions (type: 'track_allocation')

Output: (success, message, credits_balance, credits_remaining, status)
```

### `submit_track_feedback(track_id TEXT, feedback TEXT)` - MODIFIÉE

Intègre validation track + transfert crédits.

```
Nouvelles vérifications (si track existe en submitted_tracks):
  ✓ user ≠ track owner
  ✓ track.status = 'active'
  ✓ track.credits_remaining > 0

Nouvelle transaction atomique:
  1. Créer feedback (comme avant)
  2. SI track existe:
     a. submitted_tracks.credits_remaining -= 1
     b. profiles.credits (feedback author) += 1
     c. IF credits_remaining = 0: status = 'pending'
     d. INSERT credit_transactions (type: 'feedback_reward')
  3. SINON (track non-soumise): juste +1 crédit (legacy compat)

Output: (success, feedback_id, message, new_credits)
```

---

## 4. ✅ Règles de Sécurité

| Table                   | SELECT           | INSERT         | UPDATE      | DELETE      |
| ----------------------- | ---------------- | -------------- | ----------- | ----------- |
| **profiles**            | Own profile      | Trigger signup | ❌ RPC only | ❌ FK       |
| **submitted_tracks**    | All tracks       | Own tracks     | ❌ RPC only | Own tracks  |
| **track_feedbacks**     | Own feedbacks    | ❌ RPC only    | ❌ RPC only | ❌ RPC only |
| **credit_transactions** | Own transactions | ❌ RPC only    | ❌ None     | ❌ None     |

**Clés de sécurité:**

- ✅ `auth.uid()` server-side TOUJOURS
- ✅ Jamais de user_id du frontend
- ✅ Contraintes CHECK au niveau DB
- ✅ Vérification propriété (for allocate)
- ✅ Atomicité PostgreSQL
- ✅ No SECURITY DEFINER inutile

---

## 5. ✅ Fichiers Frontend Modifiés/Créés

### NOUVEAU: `app/actions/credits.ts`

```typescript
allocateTracksCredits(trackId: string, amount: number)
  → AllocateCreditsResponse

getUserCredits(): Promise<number | null>

getTrackCredits(trackId: string)
  → { credits_remaining, status } | null

getUserCreditTransactions(): Promise<CreditTransaction[]>

getTrackCreditHistory(trackId: string): Promise<CreditTransaction[]>
```

### MODIFIÉ: `app/types/spotify.ts`

```typescript
interface Track {
  // existant
  id: string;
  title: string;
  coverUrl: string;
  trackId: string;
  // NOUVEAU
  creditsRemaining?: number;
  status?: string; // 'active' | 'pending'
}
```

### MODIFIÉ: `app/actions/submit.ts`

```typescript
// getSubmittedTracks() filtre maintenant:
.eq("status", "active")
.gt("credits_remaining", 0)

// Retourne now:
{
  id, track_id, title, cover_url, created_at,
  credits_remaining,  // NOUVEAU
  status              // NOUVEAU
}
```

### MODIFIÉ: `app/discover/page.tsx`

```typescript
// Conversion Track:
const convertedTracks = submittedTracks.map((track) => ({
  id: track.id,
  title: track.title,
  coverUrl: track.cover_url,
  trackId: track.track_id,
  creditsRemaining: track.credits_remaining, // NOUVEAU
  status: track.status, // NOUVEAU
}));
```

---

## 6. 🧪 Parcours de Test

### Test 1: Allocation Crédits

```
1. User A: Login → /submit
2. Submit track → status = 'pending', credits = 0
3. Dashboard: Click "Allocate 5 Credits"
4. Verify:
   ✓ Success message
   ✓ Balance: 10 → 5 (si user a 10)
   ✓ Track: pending → active, credits_remaining = 5
   ✓ Track appears in /discover
5. Check DB:
   SELECT * FROM credit_transactions
   WHERE user_id = user_a AND type = 'track_allocation'
   → amount = -5, track_id = track_uuid
```

### Test 2: Feedback → Crédit Transfer

```
1. User A: Allocate 5 credits to Track A
2. User B: Login → /discover
3. See Track A (status=active, credits=5)
4. Feedback: "Great track!"
5. Verify:
   ✓ Feedback created
   ✓ User B: 0 → 1 credit
   ✓ Track A: 5 → 4 credits
   ✓ Track still active
   ✓ User A dashboard: Track A = 4 credits
6. Check DB:
   SELECT * FROM credit_transactions
   WHERE user_id = user_b AND type = 'feedback_reward'
   → amount = 1, feedback_id = feedback_uuid, track_id = track_a
```

### Test 3: Dernier Crédit → Status Pending

```
1. Track A: credits = 1
2. User C feedback
3. Verify:
   ✓ User C: 0 → 1 credit
   ✓ Track A: 1 → 0 credits
   ✓ Track A: active → pending
   ✓ Track A DISPARAÎT du /discover
   (filter: status='active' AND credits_remaining > 0)
4. User A dashboard:
   ✓ Track A shows: status = 'pending', credits = 0
```

### Test 4: Sécurité - Own Track Feedback

```
1. User A: allocate 5 credits to Track A
2. User A try: /discover → feedback sur Track A
3. Verify:
   ✗ Error: "You cannot give feedback on your own track"
   ✓ No credit awarded
   ✓ No feedback in DB
```

### Test 5: Sécurité - Insufficient Credits

```
1. User A: 2 credits
2. Try: allocate 5 credits
3. Verify:
   ✗ Error: "Insufficient credits. You have 2 but need 5"
   ✓ No transaction created
   ✓ Balance unchanged: 2
```

### Test 6: Audit Trail

```
1. User A dashboard → "Credit History"
2. Verify transactions displayed:
   ✓ -5 track_allocation Track A
   ✓ +1 feedback_reward Track A (for each feedback)
   ✓ Timestamps correct
   ✓ Description explicit
3. Query:
   SELECT * FROM credit_transactions
   WHERE user_id = user_a
   ORDER BY created_at DESC
   → See all movements with type + amount + track/feedback
```

---

## Migrations à Appliquer

```bash
# Dans Supabase CLI:
supabase migration up

# Ou manuelle (via Supabase Dashboard SQL Editor):
# Files à exécuter dans l'ordre:
05_add_credits_to_tracks.sql
06_create_credit_transactions.sql
07_create_allocate_credits_rpc.sql
08_update_submit_feedback_with_credits.sql
09_add_credit_constraints.sql
```

---

## ✅ Validation Technique

```
✓ Build: TypeScript 0 errors
✓ Lint: ESLint 0 errors
✓ Types: Track interface updated
✓ RLS: Strict security on all tables
✓ Atomicity: PostgreSQL transactions
✓ Audit: credit_transactions immutable table
✓ Backward compat: Discover filters correct
✓ No breaking changes
```

---

## 📊 Flux Complet en Bref

```
User A: "J'alloue 5 crédits à ma track"
  ↓ allocateTracksCredits(track_uuid, 5)
  → DB: A.credits: 10→5, TrackA.credits: 0→5, status: pending→active
  → DB: transaction(-5, track_allocation)

User B: "Je feedback la track de A"
  ↓ submitTrackFeedback(spotify_id, "Great!")
  → Check: A ≠ B ✓, status=active ✓, credits>0 ✓
  → DB: feedback INSERT
  → DB: TrackA.credits: 5→4
  → DB: B.credits: 0→1
  → DB: transaction(+1, feedback_reward)
  → Découvrir: TrackA still visible (4 > 0, active)

User C: "Je feedback aussi (dernier crédit)"
  ↓ submitTrackFeedback(...)
  → DB: TrackA.credits: 1→0
  → DB: TrackA.status: active→pending
  → DB: C.credits +1
  → Découvrir: TrackA DISAPPEARS (0 ≯ 0)

User A Dashboard:
  ✓ TrackA: 0 credits, status=pending
  ✓ Earned 2 credits from feedbacks
  ✓ History: -5 (allocation), +2 earned
```
