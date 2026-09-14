# Applying Supabase Migrations - Step by Step

## Quick Info

- **Project URL**: https://pbztccsvkpubsdhuqtdw.supabase.co
- **Console Link**: https://supabase.com/dashboard/project/pbztccsvkpubsdhuqtdw

## Method 1: Supabase Web Console (Recommended - Easiest)

### Step 1: Go to SQL Editor

1. Open https://supabase.com/dashboard/project/pbztccsvkpubsdhuqtdw
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"** button

### Step 2: Run Migration 1 - Create Profiles Table

**Query Name**: `01_create_profiles`

Copy and paste this SQL into the editor:

```sql
-- Create profiles table to store user credits
-- This extends the auth.users table with application-specific data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Users can update their own profile (but this is restricted via RPC for credits)
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Allow INSERT when user signs up (handled by trigger below)
CREATE POLICY "Allow insert on signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Click "RUN"** and wait for success ✅

### Step 3: Run Migration 2 - Create Track Feedbacks Table

**Query Name**: `02_create_track_feedbacks`

Copy and paste this SQL:

```sql
-- Create track_feedbacks table to store user feedback on tracks
-- Each user can give feedback on each track exactly once
CREATE TABLE IF NOT EXISTS track_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL, -- Spotify track ID
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one feedback per user per track
  UNIQUE(user_id, track_id),

  -- Validate feedback length (3-2000 chars)
  CONSTRAINT feedback_length CHECK (
    LENGTH(TRIM(feedback)) >= 3 AND
    LENGTH(feedback) <= 2000
  )
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_track_feedbacks_user_id ON track_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_track_feedbacks_track_id ON track_feedbacks(track_id);
CREATE INDEX IF NOT EXISTS idx_track_feedbacks_user_track ON track_feedbacks(user_id, track_id);

-- Enable RLS on track_feedbacks
ALTER TABLE track_feedbacks ENABLE ROW LEVEL SECURITY;

-- Create policies for track_feedbacks
-- Users can read their own feedbacks
CREATE POLICY "Users can read their own feedbacks"
  ON track_feedbacks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users cannot directly insert (must use RPC)
CREATE POLICY "No direct insert on feedbacks"
  ON track_feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

-- Users cannot directly update
CREATE POLICY "No direct update on feedbacks"
  ON track_feedbacks
  FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- Users cannot directly delete
CREATE POLICY "No direct delete on feedbacks"
  ON track_feedbacks
  FOR DELETE
  TO authenticated
  USING (FALSE);
```

**Click "RUN"** and wait for success ✅

### Step 4: Run Migration 3 - Create RPC Function

**Query Name**: `03_create_submit_feedback_rpc`

Copy and paste this SQL:

```sql
-- RPC function to submit feedback and award credit atomically
-- This ensures that both operations succeed or both fail together
CREATE OR REPLACE FUNCTION public.submit_track_feedback(
  p_track_id TEXT,
  p_feedback TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  feedback_id UUID,
  message TEXT,
  new_credits INTEGER
) AS $$
DECLARE
  v_user_id UUID;
  v_feedback_id UUID;
  v_feedback_trimmed TEXT;
  v_new_credits INTEGER;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();

  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      'User not authenticated'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;

  -- Validate track_id
  IF p_track_id IS NULL OR LENGTH(TRIM(p_track_id)) = 0 THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      'Track ID cannot be empty'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;

  -- Trim and validate feedback
  v_feedback_trimmed := TRIM(p_feedback);

  IF LENGTH(v_feedback_trimmed) < 3 THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      'Feedback must be at least 3 characters'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;

  IF LENGTH(v_feedback_trimmed) > 2000 THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      'Feedback must be less than 2000 characters'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;

  -- Check if user already gave feedback on this track
  IF EXISTS(
    SELECT 1 FROM track_feedbacks
    WHERE user_id = v_user_id AND track_id = p_track_id
  ) THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      'You have already given feedback on this track'::TEXT,
      (SELECT credits FROM profiles WHERE id = v_user_id)::INTEGER;
    RETURN;
  END IF;

  -- Ensure user profile exists
  INSERT INTO profiles (id, credits)
  VALUES (v_user_id, 0)
  ON CONFLICT (id) DO NOTHING;

  -- Begin transaction by inserting feedback and updating credits
  -- This is atomic because it's within the function
  BEGIN
    -- Insert feedback
    INSERT INTO track_feedbacks (user_id, track_id, feedback)
    VALUES (v_user_id, p_track_id, v_feedback_trimmed)
    RETURNING id INTO v_feedback_id;

    -- Award credit
    UPDATE profiles
    SET credits = credits + 1
    WHERE id = v_user_id
    RETURNING credits INTO v_new_credits;

    -- Return success
    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      v_feedback_id::UUID,
      'Feedback submitted successfully'::TEXT,
      v_new_credits::INTEGER;

  EXCEPTION WHEN unique_violation THEN
    -- Handle the race condition where feedback was already inserted
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      'You have already given feedback on this track'::TEXT,
      (SELECT credits FROM profiles WHERE id = v_user_id)::INTEGER;

  EXCEPTION WHEN check_violation THEN
    -- Handle validation errors
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      'Feedback validation failed'::TEXT,
      NULL::INTEGER;

  EXCEPTION WHEN OTHERS THEN
    -- Handle other errors
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      'An error occurred while submitting feedback: ' || SQLERRM::TEXT,
      NULL::INTEGER;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_track_feedback(TEXT, TEXT) TO authenticated;
```

**Click "RUN"** and wait for success ✅

---

## Verification: Check Migrations Were Applied

### Check Tables Exist

1. Go to **"Tables"** in the left sidebar
2. Verify you see:
   - `profiles` table
   - `track_feedbacks` table

### Check Functions Exist

1. Go to **"Database"** → **"Functions"** in the left sidebar
2. Verify you see:
   - `submit_track_feedback(text, text)` function

### Check Policies

1. Click on `profiles` table → **"Policies"** tab
   - Should see 3 policies (read own, update own, insert on signup)

2. Click on `track_feedbacks` table → **"Policies"** tab
   - Should see 4 policies (read own, no direct insert/update/delete)

---

## Expected Results After Migrations

✅ **profiles** table created with:

- Columns: id, credits, created_at, updated_at
- RLS enabled
- Policies protecting user data

✅ **track_feedbacks** table created with:

- Columns: id, user_id, track_id, feedback, created_at
- UNIQUE constraint on (user_id, track_id)
- CHECK constraint on feedback length
- Indexes for fast queries
- RLS enabled with restrictive policies

✅ **submit_track_feedback()** function created with:

- Atomic feedback + credit submission
- Full validation server-side
- Exception handling for race conditions
- Executable by authenticated users

---

## Troubleshooting

### Error: "relation already exists"

This means the table/function was already created. It's safe to ignore.

### Error: "undefined table"

Make sure you ran Migration 1 (profiles) before Migration 3 (which references profiles).

### Migration didn't apply?

- Check browser console for errors
- Refresh the page and try again
- Check you're logged into the correct Supabase project

---

## Method 2: Using Supabase CLI (if Docker is running)

If you have Docker running, you can use:

```bash
cd /Users/ryan/Documents/listen-exchange
supabase db push
```

This will automatically apply all migrations in the `supabase/migrations/` directory.

---

## Next Steps

After applying migrations:

1. ✅ Run the dev server: `npm run dev`
2. ✅ Create a test account via /auth/signup
3. ✅ Go to /discover and test the feedback system
4. ✅ Follow the manual testing procedures in FEEDBACK_CREDITS_IMPLEMENTATION.md

**All set! Your Supabase database is now ready for the feedback + credits system.** 🎉
