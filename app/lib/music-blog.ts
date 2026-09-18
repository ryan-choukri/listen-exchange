import "server-only";

import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";
import { requireSuperadmin } from "@/app/lib/auth/require-superadmin";
import { isMusicGenre, type MusicGenre } from "@/app/types/spotify";
import type { MusicBlogData, MusicBlogTrack } from "@/app/types/music-blog";

interface MusicBlogTrackRow {
  id: string;
  spotify_track_id: string;
  title: string;
  artist_name: string;
  cover_url: string | null;
  genres: unknown;
  published: boolean;
  display_order: number;
  nb_listens: number;
  nb_likes: number;
  published_at: string | null;
  created_at: string;
}

function parseGenres(value: unknown): MusicGenre[] {
  if (!Array.isArray(value)) return ["Other"];
  const genres = value.filter(isMusicGenre);
  return genres.length ? genres : ["Other"];
}

function mapTrack(row: MusicBlogTrackRow): MusicBlogTrack {
  return {
    id: row.id,
    spotifyTrackId: row.spotify_track_id,
    title: row.title,
    artistName: row.artist_name,
    coverUrl: row.cover_url,
    genres: parseGenres(row.genres),
    published: row.published,
    displayOrder: Number(row.display_order),
    nbListens: Number(row.nb_listens),
    nbLikes: Number(row.nb_likes),
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

const TRACK_COLUMNS =
  "id, spotify_track_id, title, artist_name, cover_url, genres, published, display_order, nb_listens, nb_likes, published_at, created_at";

export async function getPublicMusicBlogData(): Promise<MusicBlogData> {
  const { supabase, identity } = await getAuthenticatedClient();
  const { data: tracks, error: tracksError } = await supabase
    .from("music_blog_tracks")
    .select(TRACK_COLUMNS)
    .eq("published", true)
    .order("nb_listens", { ascending: true });

  if (tracksError) {
    console.error("Error fetching music blog tracks:", tracksError);
    return { tracks: [], likedTrackIds: [] };
  }

  if (!identity) {
    return {
      tracks: ((tracks ?? []) as MusicBlogTrackRow[]).map(mapTrack),
      likedTrackIds: [],
    };
  }

  const { data: likes, error: likesError } = await supabase
    .from("music_blog_likes")
    .select("track_id")
    .eq("user_id", identity.id);

  if (likesError) {
    console.error("Error fetching music blog likes:", likesError);
  }

  return {
    tracks: ((tracks ?? []) as MusicBlogTrackRow[]).map(mapTrack),
    likedTrackIds: (likes ?? []).map((like) => String(like.track_id)),
  };
}

export async function getAdminMusicBlogTracks(): Promise<MusicBlogTrack[]> {
  const { supabase } = await requireSuperadmin();
  const { data, error } = await supabase
    .from("music_blog_tracks")
    .select(TRACK_COLUMNS)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Music Blog admin query failed: ${error.message}`);
  }

  return ((data ?? []) as MusicBlogTrackRow[]).map(mapTrack);
}
