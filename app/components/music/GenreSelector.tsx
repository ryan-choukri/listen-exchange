"use client";

import {
  MUSIC_GENRES,
  type MusicGenre,
} from "@/app/types/spotify";

interface GenreSelectorProps {
  value: MusicGenre[];
  onChange: (genres: MusicGenre[]) => void;
}

export function GenreSelector({ value, onChange }: GenreSelectorProps) {
  const toggleGenre = (genre: MusicGenre) => {
    if (value.includes(genre)) {
      onChange(value.filter((selectedGenre) => selectedGenre !== genre));
      return;
    }

    if (value.length < 3) {
      onChange([...value, genre]);
    }
  };

  return (
    <fieldset>
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-sm font-black text-ink">Genres</legend>
        <span className="text-xs text-muted">{value.length}/3 selected</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Select between 1 and 3 genres.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {MUSIC_GENRES.map((genre) => {
          const isSelected = value.includes(genre);
          const isDisabled = !isSelected && value.length >= 3;

          return (
            <button
              key={genre}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => toggleGenre(genre)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? "border-coral bg-coral text-on-accent"
                  : "border-border bg-surface text-muted hover:border-coral/60 hover:text-ink"
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
