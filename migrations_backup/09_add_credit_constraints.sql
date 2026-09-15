-- Add safety constraints for credits
-- Prevents negative credit balances at database level

-- Add constraint to prevent negative credits in profiles
ALTER TABLE profiles
ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);

-- Update profiles policy to be more restrictive
-- Users can only update via RPC, not directly
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users cannot directly update their profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- Allow read-only access to own profile for seeing credit balance
CREATE POLICY "Users can read their own profile for credits"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);
