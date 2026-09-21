import type { MusicGenre } from "@/app/types/spotify";

export interface MusicBlogTrack {
  id: string;
  spotifyTrackId: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  genres: MusicGenre[];
  published: boolean;
  displayOrder: number;
  nbListens: number;
  nbLikes: number;
  publishedAt: string | null;
  createdAt: string;
  canLike?: boolean;
}

export interface MusicBlogData {
  tracks: MusicBlogTrack[];
  likedTrackIds: string[];
}

export interface MusicBlogMutationResponse {
  success: boolean;
  message: string;
}

export interface MusicBlogLikeResponse extends MusicBlogMutationResponse {
  liked?: boolean;
  nbLikes?: number;
}

export interface MusicBlogTrackInput {
  spotifyTrackId: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  genres: MusicGenre[];
  published: boolean;
  displayOrder: number;
  nbListens: number;
  nbLikes: number;
}
