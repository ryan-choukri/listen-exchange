"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";
import { requireSuperadmin } from "@/app/lib/auth/require-superadmin";
import { isMusicGenre } from "@/app/types/spotify";
import type {
  MusicBlogLikeResponse,
  MusicBlogMutationResponse,
  MusicBlogTrackInput,
} from "@/app/types/music-blog";

const SPOTIFY_TRACK_ID_PATTERN = /^[A-Za-z0-9]{22}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateTrackInput(
  input: MusicBlogTrackInput,
): MusicBlogMutationResponse | null {
  if (!SPOTIFY_TRACK_ID_PATTERN.test(input.spotifyTrackId)) {
    return { success: false, message: "Invalid Spotify track ID." };
  }

  if (!input.title.trim() || input.title.trim().length > 500) {
    return { success: false, message: "Invalid track title." };
  }

  if (!input.artistName.trim() || input.artistName.trim().length > 300) {
    return { success: false, message: "Invalid artist name." };
  }

  if (
    input.coverUrl &&
    (!input.coverUrl.startsWith("https://") || input.coverUrl.length > 2_000)
  ) {
    return { success: false, message: "Invalid cover URL." };
  }

  if (
    !Array.isArray(input.genres) ||
    input.genres.length < 1 ||
    input.genres.length > 3 ||
    new Set(input.genres).size !== input.genres.length ||
    !input.genres.every(isMusicGenre)
  ) {
    return { success: false, message: "Select between 1 and 3 genres." };
  }

  for (const value of [
    input.displayOrder,
    input.nbListens,
    input.nbLikes,
  ]) {
    if (!Number.isSafeInteger(value) || value < 0) {
      return { success: false, message: "Numeric values must be positive integers." };
    }
  }

  return null;
}

function trackPayload(input: MusicBlogTrackInput) {
  return {
    spotify_track_id: input.spotifyTrackId,
    title: input.title.trim(),
    artist_name: input.artistName.trim(),
    cover_url: input.coverUrl,
    genres: input.genres,
    published: input.published,
    display_order: input.displayOrder,
    nb_listens: input.nbListens,
    nb_likes: input.nbLikes,
    updated_at: new Date().toISOString(),
  };
}

function revalidateMusicBlog() {
  revalidatePath("/music-blog");
  revalidatePath("/admin/music-blog");
}

export async function toggleMusicBlogLike(
  trackId: string,
): Promise<MusicBlogLikeResponse> {
  if (!UUID_PATTERN.test(trackId)) {
    return { success: false, message: "Invalid track." };
  }

  const { supabase, identity } = await getAuthenticatedClient();
  if (!identity) {
    return { success: false, message: "Sign in to like this track." };
  }

  const { data, error } = await supabase.rpc("toggle_music_blog_like", {
    p_track_id: trackId,
  });

  if (error || !data?.length) {
    console.error("Music Blog like failed:", error);
    return { success: false, message: "Unable to update your like." };
  }

  const result = data[0] as {
    success: boolean;
    liked: boolean;
    nb_likes: number;
    message: string;
  };

  if (result.success) {
    revalidatePath("/music-blog");
  }

  return {
    success: result.success,
    liked: result.liked,
    nbLikes: Number(result.nb_likes),
    message: result.message,
  };
}

export async function addMusicBlogTrack(
  input: MusicBlogTrackInput,
): Promise<MusicBlogMutationResponse> {
  const validationError = validateTrackInput(input);
  if (validationError) return validationError;

  const { supabase } = await requireSuperadmin();
  const { error } = await supabase.from("music_blog_tracks").insert({
    ...trackPayload(input),
    published_at: input.published ? new Date().toISOString() : null,
  });

  if (error) {
    return {
      success: false,
      message:
        error.code === "23505"
          ? "This Spotify track is already in the Music Blog."
          : `Unable to add track: ${error.message}`,
    };
  }

  revalidateMusicBlog();
  return { success: true, message: "Track added to the Music Blog." };
}

export async function updateMusicBlogTrack(
  trackId: string,
  input: MusicBlogTrackInput,
): Promise<MusicBlogMutationResponse> {
  if (!UUID_PATTERN.test(trackId)) {
    return { success: false, message: "Invalid track." };
  }

  const validationError = validateTrackInput(input);
  if (validationError) return validationError;

  const { supabase } = await requireSuperadmin();
  const { data: existing, error: existingError } = await supabase
    .from("music_blog_tracks")
    .select("published, published_at")
    .eq("id", trackId)
    .maybeSingle();

  if (existingError || !existing) {
    return { success: false, message: "Track not found." };
  }

  const publishedAt =
    input.published && !existing.published
      ? new Date().toISOString()
      : existing.published_at;

  const { error } = await supabase
    .from("music_blog_tracks")
    .update({ ...trackPayload(input), published_at: publishedAt })
    .eq("id", trackId);

  if (error) {
    return { success: false, message: `Unable to save track: ${error.message}` };
  }

  revalidateMusicBlog();
  return { success: true, message: "Track updated." };
}

export async function deleteMusicBlogTrack(
  trackId: string,
): Promise<MusicBlogMutationResponse> {
  if (!UUID_PATTERN.test(trackId)) {
    return { success: false, message: "Invalid track." };
  }

  const { supabase } = await requireSuperadmin();
  const { error } = await supabase
    .from("music_blog_tracks")
    .delete()
    .eq("id", trackId);

  if (error) {
    return { success: false, message: `Unable to delete track: ${error.message}` };
  }

  revalidateMusicBlog();
  return { success: true, message: "Track removed from the Music Blog." };
}
