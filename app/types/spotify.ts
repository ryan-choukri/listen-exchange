// Spotify oEmbed Response
export interface SpotifyOEmbedResponse {
  title: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  version: string;
  provider_name: string;
  provider_url: string;
  html: string;
  width: number;
  height: number;
}

// Track data for our app
export interface Track {
  id: string;
  title: string;
  coverUrl: string;
  trackId: string; // Spotify track ID - used to reconstruct URLs dynamically
}

// Spotify iFrame API events
export interface SpotifyPlaybackUpdate {
  position: number;
  duration: number;
  isPaused: boolean;
  isBuffering: boolean;
}

// Track listening state
export interface ListeningState {
  totalListenedMs: number;
  isPlaying: boolean;
  lastUpdateTime: number;
  hasReached60Seconds: boolean;
}

// User profile with credits
export interface UserProfile {
  id: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

// Track feedback
export interface TrackFeedback {
  id: string;
  user_id: string;
  track_id: string;
  feedback: string;
  created_at: string;
}

// Response from submit_track_feedback RPC
export interface SubmitFeedbackResponse {
  success: boolean;
  feedback_id: string | null;
  message: string;
  new_credits: number | null;
}

// Submitted track (user-submitted content for discovery)
export interface SubmittedTrack {
  id: string;
  user_id: string;
  track_id: string;
  title: string;
  cover_url: string;
  created_at: string;
}

// Utility functions to generate Spotify URLs and embeds from trackId
export function getSpotifyTrackUrl(trackId: string): string {
  return `https://open.spotify.com/track/${trackId}`;
}

export function getSpotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
}

export function getSpotifyEmbedHtml(trackId: string): string {
  const embedUrl = getSpotifyEmbedUrl(trackId);
  return `<iframe style="border-radius:12px" src="${embedUrl}" width="100%" height="152" frameBorder="0" allowFullScreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
}
