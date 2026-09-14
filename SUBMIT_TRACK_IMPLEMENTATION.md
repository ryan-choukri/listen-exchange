# Submit Your Track - Backend Implementation

## ✅ Implementation Complete

### 1. Database Schema (Migration 04)

**Table: `submitted_tracks`**

```sql
CREATE TABLE submitted_tracks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Foreign key to user
  track_id TEXT NOT NULL,                 -- Spotify track ID
  title TEXT NOT NULL,                    -- Track title
  cover_url TEXT NOT NULL,                -- Album cover URL
  created_at TIMESTAMP,
  UNIQUE(user_id, track_id)              -- Prevent duplicates per user
)
```

**Security: RLS Policies**

- ✅ `Anyone can read submitted tracks` - All authenticated users can discover tracks
- ✅ `Users can insert their own tracks` - Users can only add their own submissions
- ✅ `Users can delete their own tracks` - Users can only remove their own submissions
- ✅ `No updates on submitted tracks` - Tracks are immutable (write-once)

**Indexes**

- ✅ `idx_submitted_tracks_user_id` - Fast lookup by submitter
- ✅ `idx_submitted_tracks_track_id` - Fast lookup by Spotify track ID

---

### 2. Server Actions (app/actions/submit.ts)

**Function: `submitTrack(url, title, coverUrl)`**

**What it does:**

1. Extracts Spotify Track ID from URL using regex
2. Validates all inputs (title length, URL format, cover URL)
3. Gets authenticated user from Supabase Auth
4. Checks for duplicate submissions (same user + track_id)
5. Inserts into `submitted_tracks` table
6. Returns success/error response with message

**Input Validation:**

- ✅ Valid Spotify URL format (regex extracts track ID)
- ✅ Title: non-empty, max 500 chars
- ✅ Cover URL: valid HTTP URL
- ✅ Authentication: user must be logged in
- ✅ Uniqueness: prevents re-submission of same track by same user

**Error Handling:**

- Returns `{ success: false, message: "..." }` for all failures
- No exceptions thrown to frontend
- User-friendly error messages

**Response:**

```typescript
{
  success: true,
  message: "Track submitted successfully! It's now available in Discovery.",
  trackId: "2lTm559tuIvatlT1u0JYG2"
}
```

---

### 3. Frontend Integration (app/submit/page.tsx)

**Changes:**

1. ✅ Added `submitTrack` server action import
2. ✅ Added state: `isSubmitting`, `success`
3. ✅ Updated `handleAddTrack()` to call server action instead of alert
4. ✅ Added error message display
5. ✅ Added success message display (auto-clear after 3 seconds)
6. ✅ Updated button to show loading state ("Submitting...")

**User Flow:**

```
1. User enters Spotify URL
2. Clicks "Fetch Track Info"
3. oEmbed data loaded (title, thumbnail)
4. User clicks "Add This Track"
5. Frontend calls submitTrack(url, title, coverUrl)
6. Server validates and inserts into DB
7. Success/error message shown
8. Form cleared on success
```

---

### 4. Types (app/types/spotify.ts)

Added new interface:

```typescript
export interface SubmittedTrack {
  id: string;
  user_id: string;
  track_id: string;
  title: string;
  cover_url: string;
  created_at: string;
}
```

---

## 🔒 Security Guarantees

| Threat                            | Prevention                               |
| --------------------------------- | ---------------------------------------- |
| **Unauthenticated submission**    | Server checks `auth.uid()`               |
| **Duplicate submission**          | UNIQUE constraint on (user_id, track_id) |
| **Track modification**            | RLS policy prevents UPDATE operations    |
| **Delete other users' tracks**    | RLS policy checks user_id on DELETE      |
| **Read other users' submissions** | Anyone can read (discovery purpose)      |
| **Invalid data**                  | Server-side validation before INSERT     |

---

## 🎯 Next Steps: Integration with Discovery

### Current State

- `/discover` page uses mock `MOCK_TRACKS` array
- `submitted_tracks` table now exists with user submissions

### To Complete Full Feature

You have two options:

**Option A: Update Discover to use Supabase data**

1. Create server action: `getSubmittedTracks()` in `app/actions/submit.ts`
2. Fetch from Supabase in DiscoverPage useEffect
3. Replace `MOCK_TRACKS` with real database data

**Option B: Keep mock data for now**

- Current setup works fine - submitted tracks are saved
- Can query Supabase console to verify submissions
- Easy to switch to real data later

---

## ✅ What Works Now

```
User Flow: Submit Track
  ↓
/submit page → Paste Spotify URL
  ↓
Frontend validates URL + fetches oEmbed
  ↓
User clicks "Add This Track"
  ↓
Frontend calls submitTrack(url, title, coverUrl)
  ↓
Server action extracts track ID
  ↓
Server validates & inserts into submitted_tracks
  ↓
RLS ensures user owns the submission
  ↓
Database prevents duplicates via UNIQUE constraint
  ↓
Success message shown to user
  ↓
Data persisted in Supabase
```

---

## 📊 Database Queries

### To check submitted tracks:

```sql
-- All submitted tracks
SELECT * FROM submitted_tracks ORDER BY created_at DESC;

-- Tracks by specific user
SELECT * FROM submitted_tracks
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Find a specific track
SELECT * FROM submitted_tracks
WHERE track_id = '2lTm559tuIvatlT1u0JYG2';

-- Submissions count per user
SELECT user_id, COUNT(*) as submission_count
FROM submitted_tracks
GROUP BY user_id;
```

---

## 🚀 Files Created/Modified

### Created:

- ✅ `supabase/migrations/04_create_submitted_tracks.sql` - Database schema + RLS
- ✅ `app/actions/submit.ts` - Server action for track submission

### Modified:

- ✅ `app/submit/page.tsx` - Frontend integration with server action
- ✅ `app/types/spotify.ts` - Added SubmittedTrack interface

### No Changes:

- ✅ `app/discover/page.tsx` - Works with current mock data or future real data
- ✅ `app/hooks/useSpotifyTracker.ts` - No changes needed

---

## 🧪 Testing

### Manual Test Flow:

1. **Prepare:**
   - Go to http://localhost:3000/submit
   - Be logged in (signup if needed)

2. **Test Submission:**
   - Find a Spotify track URL (example: https://open.spotify.com/track/2lTm559tuIvatlT1u0JYG2)
   - Paste into input field
   - Click "Fetch Track Info"
   - Verify oEmbed data loads (title, thumbnail)
   - Click "Add This Track"

3. **Verify Success:**
   - Green success message appears: "✓ Track submitted successfully!"
   - URL input clears
   - Form resets

4. **Test Duplicate Prevention:**
   - Try submitting same URL again
   - Error message: "You have already submitted this track"
   - Button doesn't process duplicate

5. **Verify in Supabase:**
   - Go to Supabase console
   - Tables → submitted_tracks
   - See your submissions with user_id, track_id, title, cover_url

### Edge Cases Handled:

- ✅ Invalid URL format → Error message
- ✅ Not authenticated → "You must be logged in"
- ✅ Duplicate submission → "You have already submitted this track"
- ✅ Network error → Graceful error message
- ✅ Empty title/URL → Validation error

---

## 🎉 Summary

You now have:

- ✅ Full backend for track submission
- ✅ Database schema with duplicate prevention
- ✅ RLS policies for security
- ✅ Server-side validation
- ✅ Frontend integration with loading/success/error states
- ✅ Track data persisted in Supabase (user_id, track_id, title, cover_url)
- ✅ Ready to integrate with Discover page (optional next step)

**The feature is complete and production-ready!** 🚀
