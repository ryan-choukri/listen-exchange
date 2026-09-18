import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Usage:
 *   npm run seed:demo
 *   npm run seed:demo:cleanup
 *
 * Required in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_USER_PASSWORD
 */

const SEED_SOURCE = "listen-exchange-demo-v1";
const USER_COUNT = 30;
const LISTENER_POOL_SIZE = 25;
const FALLBACK_COVER_URL = "https://open.spotify.com/favicon.ico";

export const SEED_SPOTIFY_TRACKS = [
  {
    artist: "Prima Queen",
    title: "Back Row",
    id: "2uuoUoMFtkLUxu1JUdfVo7",
    genres: ["Pop", "Rock"],
  },
  {
    artist: "Snazzback",
    title: "Equinox",
    id: "0ltYgFjVpuCtjrgpmb737Z",
    genres: ["Jazz", "Electronic"],
  },
  {
    artist: "Mamas Gun",
    title: "This Is The Day",
    id: "1oWcOzDppr7S5fekLGMkcr",
    genres: ["R&B / Soul", "Pop"],
  },
  {
    artist: "Blue Bendy",
    title: "Goodnight Bobby",
    id: "7DorV3ChDdaiaBViOjG8IB",
    genres: ["Rock"],
  },
  {
    artist: "deary",
    title: "No Ordinary Love",
    id: "5BjsreDPVHSd0CkPluD5rZ",
    genres: ["Pop", "Other"],
  },
  {
    artist: "Jockstrap",
    title: "All roads lead to London",
    id: "1TKtSvSbTMjyaGMkSJWzaM",
    genres: ["Electronic", "Other"],
  },
  {
    artist: "bdrmm",
    title: "A Reason to Celebrate",
    id: "17j8RpXtHCRUZmKExDimjI",
    genres: ["Rock", "Electronic"],
  },
  {
    artist: "Melt Yourself Down",
    title: "Every Single Day",
    id: "4b9oR0if2hOpScwqhBumTc",
    genres: ["Jazz", "Electronic"],
  },
  {
    artist: "Brown Horse",
    title: "Reservoir",
    id: "2eWJ5AXFjRMANgyH6NbBfw",
    genres: ["Folk", "Country"],
  },
  {
    artist: "The New Eves",
    title: "Original Sin",
    id: "4PrSiHudgJKTaGAk3xdSqg",
    genres: ["Folk", "Other"],
  },
  {
    artist: "The Deep Blue",
    title: "Water water",
    id: "2EvgPhMAwKEE83WGU6iXMK",
    genres: ["Folk", "Pop"],
  },
  {
    artist: "Night Tapes",
    title: "projections",
    id: "41aB8zL0YEqnxWZYcZBMxH",
    genres: ["Electronic", "Pop"],
  },
  {
    artist: "Real Lies",
    title: "Boss Trick",
    id: "6ba0WD7l1DZtA5FTGDdyhe",
    genres: ["Electronic"],
  },
  {
    artist: "PVA",
    title: "Kim",
    id: "0PdezPqME7lbrXf5Lj73Zw",
    genres: ["Electronic", "Rock"],
  },
  {
    artist: "Mermaid Chunky",
    title: "a w w",
    id: "1FbhygaxdtRWi7W42LKQST",
    genres: ["Electronic", "Other"],
  },
  {
    artist: "Monster Florence",
    title: "TOOTHSKIN",
    id: "7wzPXtglUGRIC49XOcGSJQ",
    genres: ["Hip-Hop / Rap", "Rock"],
  },
  {
    artist: "The Silhouettes Project",
    title: "Eucalyptus",
    id: "3REh3rlmhnnmf9RI82EO1p",
    genres: ["Hip-Hop / Rap"],
  },
  {
    artist: "MRCY",
    title: "R.L.M",
    id: "6zEqtQ5IOVTV7Q55NQ6YQm",
    genres: ["R&B / Soul"],
  },
  {
    artist: "Babeheaven",
    title: "Swimming up River",
    id: "2zWT5nc1zo8xdX0pkN9eL3",
    genres: ["R&B / Soul", "Pop"],
  },
  {
    artist: "oreglo",
    title: "M11",
    id: "1V6lKcSXiuFdqZEoKH0CIz",
    genres: ["Jazz"],
  },
  {
    artist: "Ebi Soda",
    title: "Chandler",
    id: "2u6lMgXSzMJUZNXXgSENr0",
    genres: ["Jazz"],
  },
  {
    artist: "Mammal Hands",
    title: "Little One",
    id: "20RgsB6OPTtmYVR0guIL6M",
    genres: ["Jazz", "Other"],
  },
  {
    artist: "Nubiyan Twist",
    title: "Keeper",
    id: "1BRlnV1Am5NkzHpp5dAXBj",
    genres: ["Jazz", "Afrobeats"],
  },
  {
    artist: "The Allergies",
    title: "Hot Sensation",
    id: "2cwKVrLex4P6rt80YuPjhV",
    genres: ["R&B / Soul", "Hip-Hop / Rap"],
  },
  {
    artist: "Portico Quartet",
    title: "4096 Colours",
    id: "24tUf62XijtWQEJwQBBsKv",
    genres: ["Jazz", "Electronic"],
  },
  {
    artist: "Penguin Cafe",
    title: "At the Top of the Hill, They Stood...",
    id: "3aAByAhCAkqPMNNDA88My3",
    genres: ["Classical", "Other"],
  },
  {
    artist: "Gentleman's Dub Club",
    title: "High On Nothing",
    id: "10yVj9AY4zBQnq8gZBXx8j",
    genres: ["Electronic", "Other"],
  },
  {
    artist: "Los Bitchos",
    title: "Las Panteras",
    id: "00Ask4gOLP8zPwa1uZgNt0",
    genres: ["Latin", "Other"],
  },
  {
    artist: "Heriot",
    title: "Siege Lord",
    id: "1yJZrbFgGQb3bo0i7B9oTY",
    genres: ["Rock", "Other"],
  },
  {
    artist: "Pupil Slicer",
    title: "Momentary Actuality",
    id: "2KserekRefyIM72DRj1v4q",
    genres: ["Rock", "Other"],
  },
] as const;

const FINAL_TRACK_CREDITS = [20, 10, 5, 1, 10, 5, 1, 0] as const;
const PROFILE_BALANCES = [
  40, 28, 20, 15, 12, 10, 8, 6, 5, 4, 3, 2, 1, 0, 0, 30, 18, 12, 8, 5, 3, 2, 1,
  0, 0, 15, 7, 3, 1, 0,
] as const;

const DISPLAY_NAMES = [
  "Alex Morgan",
  "Sam Rivera",
  "Jordan Lee",
  "Taylor Brooks",
  "Casey Martin",
  "Jamie Stone",
  "Morgan Blake",
  "Riley Parker",
  "Cameron Reed",
  "Avery Cole",
  "Robin Hayes",
  "Drew Bennett",
  "Skyler Ward",
  "Quinn Foster",
  "Peyton Gray",
  "Emerson Lane",
  "Rowan Ellis",
  "Finley Scott",
  "Dakota James",
  "Charlie Knox",
  "Sasha Bell",
  "Reese Harper",
  "Milan Cruz",
  "Jules Carter",
  "Remy Lewis",
  "Noa Bailey",
  "Eden Cooper",
  "Lou Taylor",
  "Mika Ross",
  "Billie Young",
] as const;

const FEEDBACK_TEMPLATES = [
  "Great energy and a strong hook; the arrangement stays engaging throughout.",
  "The rhythm section feels tight, and the dynamics give the chorus real impact.",
  "The production has a clear identity and the main riff is immediately memorable.",
  "The vocal delivery fits the track well and keeps the momentum moving forward.",
  "The contrast between the verses and chorus works especially well on this track.",
  "The mix feels punchy and focused; the ending lands without overstaying its welcome.",
] as const;

type SeedMode = "seed" | "cleanup";

type SeedUser = {
  id: string;
  email: string;
  displayName: string;
  client: SupabaseClient;
};

type TrackPlan = (typeof SEED_SPOTIFY_TRACKS)[number] & {
  index: number;
  ownerIndex: number;
  finalCredits: number;
  rewardCount: number;
  allocation: number;
};

type SeededTrack = TrackPlan & {
  databaseId: string;
  ownerId: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} in .env.local.`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function assertNoError(context: string, error: unknown): void {
  if (error) {
    throw new Error(`${context}: ${errorMessage(error)}`);
  }
}

function getMode(): SeedMode {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: seed-demo-data.ts [--cleanup]");
    process.exit(0);
  }
  if (args.length === 0) return "seed";
  if (args.length === 1 && args[0] === "--cleanup") return "cleanup";
  throw new Error(`Unknown arguments: ${args.join(" ")}`);
}

function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function listSeedUsers(admin: SupabaseClient) {
  const seedUsers = [];
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    assertNoError("Unable to list Auth users", error);

    seedUsers.push(
      ...data.users.filter(
        (user) => user.app_metadata?.seed_source === SEED_SOURCE,
      ),
    );

    if (data.users.length < perPage) break;
  }

  return seedUsers;
}

async function deleteRows(
  admin: SupabaseClient,
  table: string,
  column: string,
  values: string[],
) {
  if (values.length === 0) return;
  const { error } = await admin.from(table).delete().in(column, values);
  assertNoError(`Unable to clean ${table}`, error);
}

async function cleanupSeedData(admin: SupabaseClient) {
  const users = await listSeedUsers(admin);
  if (users.length === 0) {
    console.log("No demo seed users found.");
    return;
  }

  const userIds = users.map((user) => user.id);
  const seedUserIds = new Set(userIds);

  const { data: tracks, error: tracksError } = await admin
    .from("submitted_tracks")
    .select("id, track_id")
    .in("user_id", userIds);
  assertNoError("Unable to inspect seeded tracks", tracksError);

  const trackIds = (tracks ?? []).map((track) => String(track.id));
  const spotifyTrackIds = (tracks ?? [])
    .map((track) => track.track_id)
    .filter((trackId): trackId is string => typeof trackId === "string");

  if (trackIds.length > 0) {
    const [
      { data: sessions, error: sessionsError },
      { data: transactions, error: transactionsError },
      { data: feedbacks, error: feedbacksError },
    ] = await Promise.all([
      admin
        .from("listening_sessions")
        .select("id, user_id")
        .in("submitted_track_id", trackIds),
      admin
        .from("credit_transactions")
        .select("id, user_id, amount")
        .in("track_id", trackIds),
      spotifyTrackIds.length > 0
        ? admin
            .from("track_feedbacks")
            .select("id, user_id")
            .in("track_id", spotifyTrackIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    assertNoError("Unable to inspect listening sessions", sessionsError);
    assertNoError("Unable to inspect credit transactions", transactionsError);
    assertNoError("Unable to inspect track feedbacks", feedbacksError);

    // Capture the credit impact for real users now, but only apply it AFTER
    // all linked activity has been deleted successfully. This avoids changing
    // balances when cleanup later fails on a constraint/trigger.
    const externalCreditDelta = new Map<string, number>();

    for (const transaction of transactions ?? []) {
      const userId = String(transaction.user_id);
      if (seedUserIds.has(userId)) continue;

      const amount = Number(transaction.amount);
      if (!Number.isFinite(amount) || amount === 0) continue;

      externalCreditDelta.set(
        userId,
        (externalCreditDelta.get(userId) ?? 0) + amount,
      );
    }

    const externalSessionCount = (sessions ?? []).filter(
      (row) => !seedUserIds.has(String(row.user_id)),
    ).length;
    const externalTransactionCount = (transactions ?? []).filter(
      (row) => !seedUserIds.has(String(row.user_id)),
    ).length;
    const externalFeedbackCount = (feedbacks ?? []).filter(
      (row) => !seedUserIds.has(String(row.user_id)),
    ).length;

    console.log(
      `Deleting activity linked to seeded tracks: ` +
        `${sessions?.length ?? 0} sessions (${externalSessionCount} external), ` +
        `${feedbacks?.length ?? 0} feedbacks (${externalFeedbackCount} external), ` +
        `${transactions?.length ?? 0} credit transactions (${externalTransactionCount} external).`,
    );

    // Delete every interaction linked to a seeded track, including rows owned by real users.
    // Important order:
    //   1. transactions
    //   2. sessions
    //   3. feedbacks
    // Deleting feedbacks first can fire a trigger that rewrites the still-existing
    // listening session into a state rejected by listening_sessions_reward_state_check.
    await deleteRows(admin, "credit_transactions", "track_id", trackIds);
    await deleteRows(
      admin,
      "listening_sessions",
      "submitted_track_id",
      trackIds,
    );
    await deleteRows(admin, "track_feedbacks", "track_id", spotifyTrackIds);

    // Only adjust real-user balances once the destructive part above completed.
    // In the previous failed run the affected account was already clamped to 0,
    // so rerunning this version remains safe for that account.
    if (externalCreditDelta.size > 0) {
      const externalUserIds = [...externalCreditDelta.keys()];
      const { data: profiles, error: profilesError } = await admin
        .from("profiles")
        .select("id, credits")
        .in("id", externalUserIds);
      assertNoError("Unable to inspect external user balances", profilesError);

      for (const profile of profiles ?? []) {
        const userId = String(profile.id);
        const currentCredits = Number(profile.credits ?? 0);
        const delta = externalCreditDelta.get(userId) ?? 0;
        const restoredCredits = Math.max(0, currentCredits - delta);

        const { error: updateError } = await admin
          .from("profiles")
          .update({
            credits: restoredCredits,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        assertNoError(`Unable to restore credits for ${userId}`, updateError);

        console.log(
          `Restored external user ${userId}: ${currentCredits} -> ${restoredCredits} credits.`,
        );
      }
    }
  }

  // Remove any remaining rows owned by seed users, even if they are not tied to a seed track.
  // Keep the same safe ordering here too.
  await deleteRows(admin, "credit_transactions", "user_id", userIds);
  await deleteRows(admin, "listening_sessions", "user_id", userIds);
  await deleteRows(admin, "track_feedbacks", "user_id", userIds);
  await deleteRows(admin, "submitted_tracks", "user_id", userIds);
  await deleteRows(admin, "profiles", "id", userIds);

  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    assertNoError(`Unable to delete ${user.email ?? user.id}`, error);
  }

  console.log(
    `Deleted ${users.length} demo users, their seeded tracks, and all interactions linked to those tracks.`,
  );
}

function buildTrackPlans(): TrackPlan[] {
  return SEED_SPOTIFY_TRACKS.map((track, index) => {
    const finalCredits =
      FINAL_TRACK_CREDITS[index % FINAL_TRACK_CREDITS.length];
    const rewardCount = finalCredits === 0 ? 0 : index % 5 === 0 ? 2 : 1;

    return {
      ...track,
      index,
      ownerIndex: index % USER_COUNT,
      finalCredits,
      rewardCount,
      allocation: finalCredits + rewardCount,
    };
  });
}

function initialProfileCredits(trackPlans: TrackPlan[]): number[] {
  const balances = [...PROFILE_BALANCES];
  for (const track of trackPlans) {
    balances[track.ownerIndex] += track.allocation;
  }
  return balances;
}

async function loadSpotifyCovers(trackPlans: TrackPlan[]) {
  const covers = new Map<string, string>();
  let fallbackCount = 0;
  const concurrency = 6;

  for (let start = 0; start < trackPlans.length; start += concurrency) {
    const batch = trackPlans.slice(start, start + concurrency);
    await Promise.all(
      batch.map(async (track) => {
        try {
          const spotifyUrl = `https://open.spotify.com/track/${track.id}`;
          const endpoint = new URL("https://open.spotify.com/oembed");
          endpoint.searchParams.set("url", spotifyUrl);
          const response = await fetch(endpoint, {
            signal: AbortSignal.timeout(8_000),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const body = (await response.json()) as { thumbnail_url?: unknown };
          if (typeof body.thumbnail_url !== "string") {
            throw new Error("Missing thumbnail_url");
          }
          covers.set(track.id, body.thumbnail_url);
        } catch {
          fallbackCount += 1;
          covers.set(track.id, FALLBACK_COVER_URL);
        }
      }),
    );
  }

  if (fallbackCount > 0) {
    console.warn(`${fallbackCount} Spotify covers used the fallback image.`);
  }
  return covers;
}

async function createUsers(
  admin: SupabaseClient,
  url: string,
  publishableKey: string,
  password: string,
): Promise<SeedUser[]> {
  const users: SeedUser[] = [];

  for (let index = 0; index < USER_COUNT; index += 1) {
    const number = String(index + 1).padStart(2, "0");
    const email = `listenexchange.demo${number}@example.com`;
    const displayName = DISPLAY_NAMES[index];
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        is_test: true,
        seed_source: SEED_SOURCE,
      },
      app_metadata: {
        seed_source: SEED_SOURCE,
      },
    });
    assertNoError(`Unable to create ${email}`, error);
    if (!data.user) throw new Error(`Supabase did not return ${email}.`);

    const client = createSupabaseClient(url, publishableKey);
    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });
    assertNoError(`Unable to sign in ${email}`, signInError);

    users.push({ id: data.user.id, email, displayName, client });
    if ((index + 1) % 5 === 0) {
      console.log(`Created ${index + 1}/${USER_COUNT} demo users.`);
    }
  }

  return users;
}

async function createTracks(
  admin: SupabaseClient,
  users: SeedUser[],
  plans: TrackPlan[],
  covers: Map<string, string>,
): Promise<SeededTrack[]> {
  const tracks: SeededTrack[] = [];

  for (const plan of plans) {
    const owner = users[plan.ownerIndex];
    const { data, error } = await owner.client.rpc("create_submitted_track", {
      p_track_id: plan.id,
      p_title: plan.title,
      p_artist_name: plan.artist,
      p_cover_url: covers.get(plan.id) ?? FALLBACK_COVER_URL,
      p_genres: [...plan.genres],
    });
    assertNoError(`Unable to submit ${plan.title}`, error);

    const result = Array.isArray(data) ? data[0] : null;
    if (!result?.success || typeof result.submitted_track_id !== "string") {
      throw new Error(
        `Unable to submit ${plan.title}: ${String(result?.message ?? "no RPC result")}`,
      );
    }

    if (plan.allocation > 0) {
      const { data: allocationData, error: allocationError } =
        await owner.client.rpc("allocate_track_credits", {
          p_track_id: result.submitted_track_id,
          p_amount: plan.allocation,
        });
      assertNoError(
        `Unable to allocate credits to ${plan.title}`,
        allocationError,
      );

      const allocation = Array.isArray(allocationData)
        ? allocationData[0]
        : null;
      if (!allocation?.success) {
        throw new Error(
          `Unable to allocate credits to ${plan.title}: ${String(allocation?.message ?? "no RPC result")}`,
        );
      }
    }

    tracks.push({
      ...plan,
      databaseId: result.submitted_track_id,
      ownerId: owner.id,
    });

    if ((plan.index + 1) % 10 === 0) {
      console.log(`Created ${plan.index + 1}/${plans.length} demo tracks.`);
    }
  }

  const { count, error } = await admin
    .from("submitted_tracks")
    .select("id", { count: "exact", head: true })
    .in(
      "user_id",
      users.map((user) => user.id),
    );
  assertNoError("Unable to verify submitted tracks", error);
  if (count !== plans.length) {
    throw new Error(`Expected ${plans.length} tracks, found ${count ?? 0}.`);
  }

  return tracks;
}

function pickListener(
  users: SeedUser[],
  ownerId: string,
  seed: number,
  excludedIds: Set<string>,
): SeedUser {
  for (let offset = 0; offset < LISTENER_POOL_SIZE; offset += 1) {
    const user = users[(seed * 7 + offset) % LISTENER_POOL_SIZE];
    if (user.id !== ownerId && !excludedIds.has(user.id)) return user;
  }
  throw new Error("Unable to find an eligible demo listener.");
}

async function createCompletedSession(
  admin: SupabaseClient,
  listener: SeedUser,
  track: SeededTrack,
  requiredListenMs: number,
  ordinal: number,
) {
  const completedAt = new Date();
  const startedAt = new Date(
    completedAt.getTime() - requiredListenMs - 5_000 - (ordinal % 4) * 1_000,
  );
  const { data, error } = await admin
    .from("listening_sessions")
    .insert({
      user_id: listener.id,
      submitted_track_id: track.databaseId,
      spotify_track_id: track.id,
      status: "completed",
      started_at: startedAt.toISOString(),
      last_heartbeat_at: completedAt.toISOString(),
      required_listen_ms: requiredListenMs,
      listened_ms: requiredListenMs,
      last_spotify_position_ms:
        requiredListenMs + 15_000 + (ordinal % 8) * 1_000,
      completed_at: completedAt.toISOString(),
      created_at: startedAt.toISOString(),
      updated_at: completedAt.toISOString(),
    })
    .select("id")
    .single();
  assertNoError(`Unable to create a listen for ${track.title}`, error);
  if (!data?.id)
    throw new Error(`No listening session returned for ${track.title}.`);
  return String(data.id);
}

async function rewardCompletedSession(
  listener: SeedUser,
  track: SeededTrack,
  sessionId: string,
  ordinal: number,
) {
  const template = FEEDBACK_TEMPLATES[ordinal % FEEDBACK_TEMPLATES.length];
  const { data, error } = await listener.client.rpc("submit_track_feedback", {
    p_listening_session_id: sessionId,
    p_feedback: `${template} (${track.title})`,
  });
  assertNoError(`Unable to submit feedback for ${track.title}`, error);

  const result = Array.isArray(data) ? data[0] : null;
  if (!result?.success) {
    throw new Error(
      `Unable to reward feedback for ${track.title}: ${String(result?.message ?? "no RPC result")}`,
    );
  }
}

async function createListeningActivity(
  admin: SupabaseClient,
  users: SeedUser[],
  tracks: SeededTrack[],
) {
  const { data: config, error: configError } = await admin
    .from("listening_config")
    .select("min_listen_duration_ms")
    .eq("id", true)
    .single();
  assertNoError("Unable to load listening configuration", configError);
  const requiredListenMs = Number(config?.min_listen_duration_ms);
  if (!Number.isInteger(requiredListenMs) || requiredListenMs <= 0) {
    throw new Error("Invalid min_listen_duration_ms in listening_config.");
  }

  let completedSessions = 0;
  let feedbacks = 0;

  for (const track of tracks.filter((item) => item.finalCredits > 0)) {
    const listenersForTrack = new Set<string>();

    for (
      let rewardIndex = 0;
      rewardIndex < track.rewardCount;
      rewardIndex += 1
    ) {
      const listener = pickListener(
        users,
        track.ownerId,
        track.index + rewardIndex,
        listenersForTrack,
      );
      listenersForTrack.add(listener.id);
      const sessionId = await createCompletedSession(
        admin,
        listener,
        track,
        requiredListenMs,
        completedSessions,
      );
      completedSessions += 1;
      await rewardCompletedSession(listener, track, sessionId, feedbacks);
      feedbacks += 1;
    }

    if (track.index % 2 === 0) {
      const listener = pickListener(
        users,
        track.ownerId,
        track.index + 11,
        listenersForTrack,
      );
      await createCompletedSession(
        admin,
        listener,
        track,
        requiredListenMs,
        completedSessions,
      );
      completedSessions += 1;
    }
  }

  console.log(
    `Created ${completedSessions} completed listens, including ${feedbacks} rewarded feedbacks.`,
  );
}

async function verifySeed(admin: SupabaseClient, userIds: string[]) {
  const [profiles, tracks, sessions, feedbacks, transactions] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("id", userIds),
      admin
        .from("submitted_tracks")
        .select("id", { count: "exact", head: true })
        .in("user_id", userIds),
      admin
        .from("listening_sessions")
        .select("id", { count: "exact", head: true })
        .in("user_id", userIds),
      admin
        .from("track_feedbacks")
        .select("id", { count: "exact", head: true })
        .in("user_id", userIds),
      admin
        .from("credit_transactions")
        .select("id", { count: "exact", head: true })
        .in("user_id", userIds),
    ]);

  for (const [label, result] of [
    ["profiles", profiles],
    ["tracks", tracks],
    ["sessions", sessions],
    ["feedbacks", feedbacks],
    ["transactions", transactions],
  ] as const) {
    assertNoError(`Unable to verify ${label}`, result.error);
  }

  console.log(
    `Verified: ${profiles.count ?? 0} profiles, ${tracks.count ?? 0} tracks, ` +
      `${sessions.count ?? 0} sessions, ${feedbacks.count ?? 0} feedbacks, ` +
      `${transactions.count ?? 0} credit transactions.`,
  );
}

async function seedDemoData(
  admin: SupabaseClient,
  url: string,
  publishableKey: string,
  password: string,
) {
  const existingUsers = await listSeedUsers(admin);
  if (existingUsers.length > 0) {
    throw new Error(
      `Found ${existingUsers.length} existing demo users. ` +
        "Run npm run seed:demo:cleanup before reseeding.",
    );
  }

  const trackPlans = buildTrackPlans();
  const profileCredits = initialProfileCredits(trackPlans);
  const coversPromise = loadSpotifyCovers(trackPlans);
  const users = await createUsers(admin, url, publishableKey, password);

  const { error: profileError } = await admin.from("profiles").upsert(
    users.map((user, index) => ({
      id: user.id,
      credits: profileCredits[index],
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id" },
  );
  assertNoError("Unable to create demo profiles", profileError);

  const tracks = await createTracks(
    admin,
    users,
    trackPlans,
    await coversPromise,
  );
  await createListeningActivity(admin, users, tracks);
  await verifySeed(
    admin,
    users.map((user) => user.id),
  );

  console.log("Demo seed complete.");
  console.log(
    "Users: listenexchange.demo01@example.com … listenexchange.demo30@example.com",
  );
  console.log("Password: the value of SEED_USER_PASSWORD (not printed).");
}

async function main() {
  const mode = getMode();
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createSupabaseClient(url, serviceRoleKey);

  if (mode === "cleanup") {
    await cleanupSeedData(admin);
    return;
  }

  const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const password = requiredEnv("SEED_USER_PASSWORD");
  if (password.length < 8) {
    throw new Error("SEED_USER_PASSWORD must contain at least 8 characters.");
  }

  await seedDemoData(admin, url, publishableKey, password);
}

main().catch((error) => {
  console.error(`Seed failed: ${errorMessage(error)}`);
  process.exitCode = 1;
});
