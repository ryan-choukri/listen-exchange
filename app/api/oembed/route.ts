import { SpotifyOEmbedResponse } from "@/app/types/spotify";
import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_TRACK_ID_REGEX = /^[A-Za-z0-9]{22}$/;

function extractSpotifyTrackId(input: string): string | null {
  const value = input.trim();

  // Sécurité basique : empêcher des inputs absurdes
  if (!value || value.length > 500) {
    return null;
  }

  // 1. Track ID brut
  if (SPOTIFY_TRACK_ID_REGEX.test(value)) {
    return value;
  }

  // 2. Spotify URI : spotify:track:xxxxx
  const uriMatch = value.match(/^spotify:track:([A-Za-z0-9]{22})$/);

  if (uriMatch) {
    return uriMatch[1];
  }

  // 3. Autorise open.spotify.com sans protocole
  let candidate = value;

  if (candidate.startsWith("open.spotify.com/")) {
    candidate = `https://${candidate}`;
  }

  // 4. URL Spotify
  try {
    const parsedUrl = new URL(candidate);

    // IMPORTANT :
    // comparaison exacte du hostname,
    // pas de includes("spotify.com")
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "open.spotify.com"
    ) {
      return null;
    }

    const parts = parsedUrl.pathname.split("/").filter(Boolean);

    /*
      Formats possibles :

      /track/ID
      /intl-fr/track/ID
      /embed/track/ID
    */

    const trackIndex = parts.indexOf("track");

    if (trackIndex === -1) {
      return null;
    }

    const trackId = parts[trackIndex + 1];

    if (!trackId || !SPOTIFY_TRACK_ID_REGEX.test(trackId)) {
      return null;
    }

    return trackId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("url");

  if (!input) {
    return NextResponse.json(
      { error: "Spotify track is required" },
      { status: 400 },
    );
  }

  const trackId = extractSpotifyTrackId(input);

  if (!trackId) {
    return NextResponse.json(
      { error: "Invalid Spotify track" },
      { status: 400 },
    );
  }

  // On reconstruit nous-mêmes l'URL.
  // On ne transmet jamais directement l'input utilisateur à Spotify.
  const spotifyUrl = `https://open.spotify.com/track/${trackId}`;

  try {
    const oembedUrl = new URL("https://open.spotify.com/oembed");

    oembedUrl.searchParams.set("url", spotifyUrl);

    const response = await fetch(oembedUrl.toString(), {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            response.status === 404
              ? "Spotify track not found"
              : "Spotify request failed",
        },
        {
          status: response.status === 404 ? 404 : 502,
        },
      );
    }

    const data: SpotifyOEmbedResponse = await response.json();

    return NextResponse.json({
      ...data,

      trackId,

      // Toujours l'URL propre
      spotifyUrl,

      embedUrl: `https://open.spotify.com/embed/track/${trackId}`,
    });
  } catch (error) {
    console.error("Spotify oEmbed error:", error);

    return NextResponse.json(
      { error: "Unable to contact Spotify" },
      { status: 502 },
    );
  }
}
