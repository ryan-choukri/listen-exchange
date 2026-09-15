# Remove Credits Feature - Implementation Guide

## Overview

Users can now remove/deallocate credits from their submitted tracks to get credits refunded back to their balance. This is the inverse operation of allocate credits.

## Components

### 1. Database Function: `remove_track_credits`

**Location:** `supabase/migrations/20260914234947_baseline.sql`

**Signature:**

```sql
remove_track_credits(p_track_id UUID, p_amount INTEGER)
```

**Returns:**

```sql
TABLE(
  success BOOLEAN,
  message TEXT,
  credits_balance INTEGER,
  credits_remaining INTEGER,
  status TEXT
)
```

**Operation:**

1. Validates user owns the track
2. Checks track has enough credits to remove
3. Locks both profiles and submitted_tracks tables (FOR UPDATE)
4. Atomically:
   - Refunds credits to user profile
   - Decrements track's credits_remaining
   - Updates track status (becomes 'pending' if depleted to 0)
   - Records 'refund' transaction

**Example Error Cases:**

- Track not found → "Track not found"
- User doesn't own track → "You can only remove credits from your own tracks"
- Track has insufficient credits → "Track has only X credits but you want to remove Y"

### 2. Server Action: `removeTracksCredits`

**Location:** `app/actions/credits.ts`

**Signature:**

```typescript
export async function removeTracksCredits(
  trackId: string,
  amount: number,
): Promise<AllocateCreditsResponse>;
```

**Usage:**

```typescript
const result = await removeTracksCredits(trackId, amount);
if (result.success) {
  console.log(
    `Removed ${amount} credits. New balance: ${result.credits_balance}`,
  );
} else {
  console.error(result.message);
}
```

### 3. UI Component: Enhanced `CreditAllocationModal`

**Location:** `app/components/CreditAllocationModal.tsx`

**Features:**

- **Mode Toggle:** Two tabs at the top: "➕ Allocate" and "➖ Remove"
- **Conditional Rendering:**
  - Allocate mode: Checks user balance
  - Remove mode: Checks track credits (disabled if 0)
- **Dynamic UI:**
  - Labels change based on mode
  - Colors adapt (green for allocate, orange for remove)
  - Preview shows relevant values
  - Info message explains the operation
- **Quick Buttons:** +/- buttons show prefix based on mode

**Props:**

```typescript
interface CreditAllocationModalProps {
  trackId: string;
  trackTitle: string;
  currentCredits: number;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

## User Flows

### Remove Credits Flow

1. **Dashboard Page:** User sees submitted tracks list
2. **Click Track Actions:** Opens modal with track details
3. **Select Remove Tab:** Shows current track credits available
4. **Enter Amount:** User inputs credits to remove (1-10, up to max available)
5. **Preview:** Shows: Current track credits → will remove → after removal
6. **Click Remove Button:** Calls `removeTracksCredits` server action
7. **Success:** Modal closes, list refreshes with updated credits
8. **Status Update:** Track status may change from 'active' to 'pending'

### Status Transitions

| Current             | Action   | Result              |
| ------------------- | -------- | ------------------- |
| active (5 credits)  | Remove 2 | active (3 credits)  |
| active (5 credits)  | Remove 5 | pending (0 credits) |
| pending (3 credits) | Remove 1 | pending (2 credits) |

## Error Handling

### Frontend Validation

- Input must be positive number
- Amount cannot exceed track's credits
- Disabled if track has 0 credits

### Backend Validation

- User authentication verified
- Track ownership verified
- Sufficient credits on track verified
- Atomic operation ensures consistency

### Error Messages

```typescript
// Invalid input
"Please enter a valid positive number";

// Insufficient track credits
"Track has only 2 credits but you want to remove 5";

// Track not found (backend)
"Track not found";

// Ownership verification failed (backend)
"You can only remove credits from your own tracks";
```

## Database Changes

### Added Columns (already exists)

- `submitted_tracks.credits_remaining` - Current credits allocated
- `submitted_tracks.status` - 'active' or 'pending'

### New RPC Function

- `remove_track_credits(uuid, integer)` - Deallocate credits

### Transaction Recording

Type: `'refund'` in `credit_transactions` table

```
id: UUID
user_id: UUID
track_id: UUID
amount: positive integer (credits refunded)
type: 'refund'
description: 'Removed X credits from track'
```

## Atomicity & Concurrency

The operation uses PostgreSQL's FOR UPDATE locking:

```sql
SELECT ... FROM profiles FOR UPDATE
SELECT ... FROM submitted_tracks FOR UPDATE
```

This ensures:

- No race conditions when removing
- No overshooting (credits can't go negative)
- Atomicity: All updates succeed or all fail
- No partial refunds

## Testing Checklist

- [ ] Deploy baseline.sql to Supabase
- [ ] Test: Remove 1 credit from active track
- [ ] Test: Remove all credits (status should become pending)
- [ ] Test: Verify user balance increased
- [ ] Test: Check credit_transactions has refund entry
- [ ] Test: Try removing more than available → error
- [ ] Test: Try removing from another user's track → error
- [ ] Test: Re-allocate after removing → should work
- [ ] Test: Modal closes on success
- [ ] Test: List refreshes with new values

## API Reference

### RPC: `remove_track_credits`

**Parameters:**

- `p_track_id` (UUID): The track to remove credits from
- `p_amount` (INTEGER): How many credits to remove

**Returns:** Success status with updated balances

**Side Effects:**

- Decrements `profiles.credits` (refund)
- Decrements `submitted_tracks.credits_remaining`
- Updates `submitted_tracks.status` if depleted
- Inserts record in `credit_transactions`

**Security:**

- SECURITY DEFINER
- Only authenticated users can call
- Must own the track
- Cannot remove more than available

### Server Action: `removeTracksCredits`

**Parameters:**

- `trackId` (string): UUID of submitted_tracks
- `amount` (number): Positive integer

**Returns:**

```typescript
{
  success: boolean;
  message: string;
  credits_balance?: number;      // New user balance
  credits_remaining?: number;    // New track credits
  status?: string;               // New track status
}
```

**Throws:** Never throws, all errors in response

## Performance Considerations

- FOR UPDATE locks may block briefly on high concurrency
- Single RPC call (no N+1 queries)
- Indexes on `submitted_tracks(status, credits_remaining)` optimize lookups
- Suitable for production use

## Future Enhancements

1. **Bulk Operations:** Remove credits from multiple tracks
2. **Scheduled Removals:** Auto-remove credits after time period
3. **Partial Refunds:** Different refund reasons (malicious feedback, etc.)
4. **Analytics:** Track removal patterns
5. **UI Improvements:**
   - Undo button (within time window)
   - Remove all button
   - Keyboard shortcuts
