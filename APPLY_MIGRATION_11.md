# Action Requise: Appliquer Migration 11

## ✅ Ce qui a été corrigé

**Ancien problème:** `column reference "credits_remaining" is ambiguous`

**Racine:** Migrations 07/08 avaient des bugs critiques:

- ❌ Pas de locking concurrent (FOR UPDATE)
- ❌ INSERT ... RETURNING avec FROM invalide
- ❌ Crédits accordés pour fake tracks
- ❌ Colonnes non-qualifiées
- ❌ Pas de SECURITY DEFINER SET search_path
- ❌ Pas de REVOKE PUBLIC

**Solution:** Migration 11 corrige tout cela.

---

## 🚀 Application (5 minutes)

### Option 1: Via CLI (Recommandé)

```bash
cd /Users/ryan/Documents/listen-exchange
supabase migration up
```

### Option 2: Via Supabase Dashboard

1. Dashboard → SQL Editor
2. Copier contenu de `supabase/migrations/11_correct_credit_system_rpcs.sql`
3. Exécuter

### Option 3: Verify

```sql
SELECT COUNT(*) FROM pg_proc WHERE proname = 'allocate_track_credits';
-- Résultat: 1 (function existe)

SELECT COUNT(*) FROM pg_proc WHERE proname = 'submit_track_feedback';
-- Résultat: 1 (function existe)
```

---

## 📊 Après Application

✅ Les deux RPC (`allocate_track_credits` et `submit_track_feedback`) sont remplacées par les versions correctes.

✅ Erreur "ambiguous column reference" DISPARAÎT.

✅ Concurrence sûre (FOR UPDATE).

✅ Atomicité complète.

✅ Strict validation (submitted_tracks only).

---

## 🧪 Tester Après Application

### Test Simple

```bash
# Go to dashboard
# Click "Allocate 5 Credits" on a track
# Verify: No error, track becomes Active
```

### Test Concurrence

```sql
-- Dans Supabase SQL Editor, deux onglets:
-- Tab 1: SELECT allocate_track_credits('track_uuid_1'::UUID, 5);
-- Tab 2: SELECT allocate_track_credits('track_uuid_2'::UUID, 5);
-- (simuler simultané)
-- Résultat: Un réussit, l'autre échoue avec "Insufficient credits"
```

---

## 📁 Fichiers

- **Migration:** `supabase/migrations/11_correct_credit_system_rpcs.sql` ✅
- **Explications:** `MIGRATION_11_EXPLANATION.md` ✅
- **Ancien fichier:** `10_fix_ambiguous_column_references.sql` ❌ (supprimé)

---

## ⏱️ Next Steps

1. **Apply migration** (2 min)
2. **Reload page** (1 min)
3. **Test allocation** (2 min)
4. **Done!** ✅

Aucun changement frontend/UI requis.
