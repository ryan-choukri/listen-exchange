


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."allocate_track_credits"("p_track_id" "uuid", "p_amount" integer) RETURNS TABLE("success" boolean, "message" "text", "credits_balance" integer, "credits_remaining" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_id UUID;
  v_track_user_id UUID;
  v_user_credits INTEGER;
  v_track_credits_remaining INTEGER;
  v_new_status TEXT;
BEGIN
  -- Validate inputs
  IF p_track_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Track ID is required'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Amount must be greater than 0'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'User not authenticated'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Lock and retrieve user's profile
  SELECT pr.credits INTO v_user_credits
  FROM public.profiles AS pr
  WHERE pr.id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Create profile if missing (shouldn't happen, but defensive)
    INSERT INTO public.profiles (id, credits)
    VALUES (v_user_id, 0)
    ON CONFLICT (id) DO NOTHING;
    v_user_credits := 0;
  END IF;
  
  -- Check if user has enough credits
  IF v_user_credits < p_amount THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Insufficient credits. You have ' || v_user_credits::TEXT || ' but need ' || p_amount::TEXT,
      v_user_credits,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Lock and retrieve submitted track
  SELECT st.user_id, st.credits_remaining
  INTO v_track_user_id, v_track_credits_remaining
  FROM public.submitted_tracks AS st
  WHERE st.id = p_track_id
  FOR UPDATE;
  
  IF v_track_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Track not found'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Verify user owns the track
  IF v_track_user_id != v_user_id THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'You can only allocate credits to your own tracks'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Deduct credits from user profile
  UPDATE public.profiles AS pr
  SET credits = pr.credits - p_amount
  WHERE pr.id = v_user_id;
  
  -- Determine new status
  v_new_status := CASE 
    WHEN (v_track_credits_remaining + p_amount) > 0 THEN 'active'
    ELSE 'pending'
  END;
  
  -- Add credits to track
  UPDATE public.submitted_tracks AS st
  SET credits_remaining = st.credits_remaining + p_amount,
      status = v_new_status
  WHERE st.id = p_track_id;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, track_id, amount, type, description)
  VALUES (v_user_id, p_track_id, -p_amount, 'track_allocation', 
    'Allocated ' || p_amount::TEXT || ' credits to track');
  
  -- Return success with new values
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Credits allocated successfully'::TEXT,
    (v_user_credits - p_amount)::INTEGER,
    (v_track_credits_remaining + p_amount)::INTEGER,
    v_new_status::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    'An error occurred while allocating credits: ' || SQLERRM::TEXT,
    NULL::INTEGER,
    NULL::INTEGER,
    NULL::TEXT;
END;
$$;


ALTER FUNCTION "public"."allocate_track_credits"("p_track_id" "uuid", "p_amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, credits)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_track_feedback"("p_track_id" "text", "p_feedback" "text") RETURNS TABLE("success" boolean, "feedback_id" "uuid", "message" "text", "new_credits" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_id UUID;
  v_feedback_id UUID;
  v_feedback_trimmed TEXT;
  v_new_credits INTEGER;
  v_submitted_track_id UUID;
  v_track_owner_id UUID;
  v_track_credits_remaining INTEGER;
  v_track_status TEXT;
BEGIN
  -- Validate feedback input
  IF p_feedback IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'Feedback cannot be empty'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
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
  
  -- Validate track_id
  IF p_track_id IS NULL OR LENGTH(TRIM(p_track_id)) = 0 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'Track ID cannot be empty'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'User not authenticated'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if user already gave feedback on this track
  IF EXISTS(
    SELECT 1 FROM public.track_feedbacks tf
    WHERE tf.user_id = v_user_id AND tf.track_id = p_track_id
  ) THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'You have already given feedback on this track'::TEXT,
      (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- Ensure user profile exists
  INSERT INTO public.profiles (id, credits)
  VALUES (v_user_id, 0)
  ON CONFLICT (id) DO NOTHING;
  
  -- Critical: Check if track exists in submitted_tracks and lock it
  -- This is the ONLY way to earn credits: the track must be submitted
  SELECT st.id, st.user_id, st.credits_remaining, st.status
  INTO v_submitted_track_id, v_track_owner_id, v_track_credits_remaining, v_track_status
  FROM public.submitted_tracks AS st
  WHERE st.track_id = p_track_id
  FOR UPDATE;
  
  -- If track is NOT a submitted track, refuse feedback entirely (NO credits for legacy feedback)
  IF v_submitted_track_id IS NULL THEN
    -- Insert feedback anyway (for record), but don't award credits
    INSERT INTO public.track_feedbacks (user_id, track_id, feedback)
    VALUES (v_user_id, p_track_id, v_feedback_trimmed)
    RETURNING id INTO v_feedback_id;
    
    -- Get current user credits (no change)
    SELECT pr.credits INTO v_new_credits
    FROM public.profiles pr
    WHERE pr.id = v_user_id;
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,
      v_feedback_id::UUID,
      'Feedback submitted (no credits available for this track)'::TEXT,
      v_new_credits::INTEGER;
    RETURN;
  END IF;
  
  -- Track IS in submitted_tracks: validate credit conditions
  
  -- User cannot feedback their own track
  IF v_track_owner_id = v_user_id THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'You cannot give feedback on your own track'::TEXT,
      (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- Track must be active
  IF v_track_status != 'active' THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'This track is not currently accepting feedback'::TEXT,
      (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- Track must have credits remaining
  IF v_track_credits_remaining <= 0 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'This track has no more credits available'::TEXT,
      (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- All conditions met: proceed atomically
  
  -- 1. Insert feedback
  INSERT INTO public.track_feedbacks (user_id, track_id, feedback)
  VALUES (v_user_id, p_track_id, v_feedback_trimmed)
  RETURNING id INTO v_feedback_id;
  
  -- 2. Award credit to feedback author
  UPDATE public.profiles AS pr
  SET credits = pr.credits + 1
  WHERE pr.id = v_user_id
  RETURNING pr.credits INTO v_new_credits;
  
  -- 3. Decrement track credits
  UPDATE public.submitted_tracks AS st
  SET credits_remaining = st.credits_remaining - 1
  WHERE st.id = v_submitted_track_id;
  
  -- 4. Update track status if depleted
  UPDATE public.submitted_tracks AS st
  SET status = 'pending'
  WHERE st.id = v_submitted_track_id
    AND st.credits_remaining <= 0;
  
  -- 5. Record transaction
  INSERT INTO public.credit_transactions (user_id, track_id, feedback_id, amount, type, description)
  VALUES (v_user_id, v_submitted_track_id, v_feedback_id, 1, 'feedback_reward', 
    'Earned credit from feedback');
  
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    v_feedback_id::UUID,
    'Feedback submitted successfully'::TEXT,
    v_new_credits::INTEGER;

EXCEPTION WHEN unique_violation THEN
  -- Duplicate feedback detected (race condition despite check above)
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    NULL::UUID,
    'You have already given feedback on this track'::TEXT,
    (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'An error occurred: ' || SQLERRM::TEXT,
      NULL::INTEGER;
END;
$$;


ALTER FUNCTION "public"."submit_track_feedback"("p_track_id" "text", "p_feedback" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "track_id" "uuid",
    "feedback_id" "uuid",
    "amount" integer NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_transactions_type_check" CHECK (("type" = ANY (ARRAY['feedback_reward'::"text", 'track_allocation'::"text", 'refund'::"text"])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "credits" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credits_non_negative" CHECK (("credits" >= 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submitted_tracks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "track_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "cover_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "credits_remaining" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "credits_remaining_non_negative" CHECK (("credits_remaining" >= 0)),
    CONSTRAINT "submitted_tracks_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."submitted_tracks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."track_feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "track_id" "text" NOT NULL,
    "feedback" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feedback_length" CHECK ((("length"(TRIM(BOTH FROM "feedback")) >= 3) AND ("length"("feedback") <= 2000)))
);


ALTER TABLE "public"."track_feedbacks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submitted_tracks"
    ADD CONSTRAINT "submitted_tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submitted_tracks"
    ADD CONSTRAINT "submitted_tracks_user_id_track_id_key" UNIQUE ("user_id", "track_id");



ALTER TABLE ONLY "public"."track_feedbacks"
    ADD CONSTRAINT "track_feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."track_feedbacks"
    ADD CONSTRAINT "track_feedbacks_user_id_track_id_key" UNIQUE ("user_id", "track_id");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_credit_transactions_feedback_id" ON "public"."credit_transactions" USING "btree" ("feedback_id");



CREATE INDEX "idx_credit_transactions_track_id" ON "public"."credit_transactions" USING "btree" ("track_id");



CREATE INDEX "idx_credit_transactions_type" ON "public"."credit_transactions" USING "btree" ("type");



CREATE INDEX "idx_credit_transactions_user_created" ON "public"."credit_transactions" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_submitted_tracks_active_credits" ON "public"."submitted_tracks" USING "btree" ("status", "credits_remaining") WHERE (("status" = 'active'::"text") AND ("credits_remaining" > 0));



CREATE INDEX "idx_submitted_tracks_status" ON "public"."submitted_tracks" USING "btree" ("status");



CREATE INDEX "idx_submitted_tracks_track_id" ON "public"."submitted_tracks" USING "btree" ("track_id");



CREATE INDEX "idx_submitted_tracks_user_id" ON "public"."submitted_tracks" USING "btree" ("user_id");



CREATE INDEX "idx_track_feedbacks_track_id" ON "public"."track_feedbacks" USING "btree" ("track_id");



CREATE INDEX "idx_track_feedbacks_user_id" ON "public"."track_feedbacks" USING "btree" ("user_id");



CREATE INDEX "idx_track_feedbacks_user_track" ON "public"."track_feedbacks" USING "btree" ("user_id", "track_id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."track_feedbacks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."submitted_tracks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submitted_tracks"
    ADD CONSTRAINT "submitted_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."track_feedbacks"
    ADD CONSTRAINT "track_feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow insert on signup" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Anyone can read submitted tracks" ON "public"."submitted_tracks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "No delete on credit_transactions" ON "public"."credit_transactions" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "No direct delete on feedbacks" ON "public"."track_feedbacks" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "No direct insert on credit_transactions" ON "public"."credit_transactions" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "No direct insert on feedbacks" ON "public"."track_feedbacks" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "No direct update on feedbacks" ON "public"."track_feedbacks" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "No update on credit_transactions" ON "public"."credit_transactions" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "No updates on submitted tracks" ON "public"."submitted_tracks" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "Users can delete their own tracks" ON "public"."submitted_tracks" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own tracks" ON "public"."submitted_tracks" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own credit transactions" ON "public"."credit_transactions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own feedbacks" ON "public"."track_feedbacks" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can read their own profile for credits" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users cannot directly update their profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submitted_tracks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."track_feedbacks" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."allocate_track_credits"("p_track_id" "uuid", "p_amount" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."allocate_track_credits"("p_track_id" "uuid", "p_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."allocate_track_credits"("p_track_id" "uuid", "p_amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_track_feedback"("p_track_id" "text", "p_feedback" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_track_feedback"("p_track_id" "text", "p_feedback" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_track_feedback"("p_track_id" "text", "p_feedback" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."submitted_tracks" TO "anon";
GRANT ALL ON TABLE "public"."submitted_tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."submitted_tracks" TO "service_role";



GRANT ALL ON TABLE "public"."track_feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."track_feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."track_feedbacks" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



















