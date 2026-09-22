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

interface PublicSubmittedTrackRow {
  id: string;
  spotify_track_id: string;
  title: string;
  artist_name: string;
  cover_url: string | null;
  genres: unknown;
  nb_listens: number;
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
    canLike: true,
  };
}

function mapSubmittedTrack(row: PublicSubmittedTrackRow): MusicBlogTrack {
  return {
    id: row.id,
    spotifyTrackId: row.spotify_track_id,
    title: row.title,
    artistName: row.artist_name || "Unknown artist",
    coverUrl: row.cover_url,
    genres: parseGenres(row.genres),
    published: true,
    displayOrder: Number.MAX_SAFE_INTEGER,
    nbListens: Number(row.nb_listens),
    nbLikes: 0,
    publishedAt: null,
    createdAt: row.created_at,
    canLike: false,
  };
}

function mergeTracks(
  musicBlogTracks: MusicBlogTrack[],
  submittedTracks: MusicBlogTrack[],
): MusicBlogTrack[] {
  const spotifyTrackIds = new Set<string>();

  return [...musicBlogTracks, ...submittedTracks].filter((track) => {
    if (spotifyTrackIds.has(track.spotifyTrackId)) return false;
    spotifyTrackIds.add(track.spotifyTrackId);
    return true;
  });
}

const TRACK_COLUMNS =
  "id, spotify_track_id, title, artist_name, cover_url, genres, published, display_order, nb_listens, nb_likes, published_at, created_at";

export async function getPublicMusicBlogData(): Promise<MusicBlogData> {
  const { supabase, identity } = await getAuthenticatedClient();
  const [musicBlogResult, submittedTracksResult] = await Promise.all([
    supabase
      .from("music_blog_tracks")
      .select(TRACK_COLUMNS)
      .eq("published", true)
      .order("nb_listens", { ascending: true }),
    supabase.rpc("get_public_music_blog_submitted_tracks"),
  ]);

  const { data: tracks, error: tracksError } = musicBlogResult;

  if (tracksError) {
    console.error("Error fetching music blog tracks:", tracksError);
  }

  if (submittedTracksResult.error) {
    console.error(
      "Error fetching submitted tracks for music blog:",
      submittedTracksResult.error,
    );
  }

  const mergedTracks = mergeTracks(
    ((tracks ?? []) as MusicBlogTrackRow[]).map(mapTrack),
    ((submittedTracksResult.data ?? []) as PublicSubmittedTrackRow[]).map(
      mapSubmittedTrack,
    ),
  );

  if (!identity) {
    return {
      tracks: mergedTracks,
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

  // filter reduce for any doublon spotify track IDs in the merged tracks list
  const uniqueTracks: MusicBlogTrack[] = [];
  const seenSpotifyTrackIds = new Set<string>();
  for (const track of mergedTracks) {
    if (!seenSpotifyTrackIds.has(track.spotifyTrackId)) {
      seenSpotifyTrackIds.add(track.spotifyTrackId);
      uniqueTracks.push(track);
    }
  }
  return {
    tracks: uniqueTracks,
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
