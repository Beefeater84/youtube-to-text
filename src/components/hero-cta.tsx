'use client';

import { useState } from 'react';

export function HeroCta() {
  const [url, setUrl] = useState('');

  return (
    <div className="relative border-[3px] border-ink bg-surface p-4 my-5">
      {/* "CLASSIFIED" badge */}
      <span className="absolute -top-2.5 left-3 bg-ink text-paper font-meta text-[0.6rem] tracking-[0.15em] px-2 py-0.5">
        CLASSIFIED
      </span>

      <label
        htmlFor="video-url"
        className="block font-meta text-[0.7rem] tracking-[0.1em] uppercase text-muted mb-2"
      >
        PASTE VIDEO URL BELOW
      </label>

      <div className="flex flex-col sm:flex-row">
        <input
          type="url"
          id="video-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtu.be/..."
          autoComplete="off"
          className="flex-1 font-meta text-sm px-3 py-2.5 border-2 border-ink border-b-0 sm:border-b-2 sm:border-r-0 bg-paper text-ink placeholder:text-divider outline-none focus:bg-surface focus:shadow-[inset_0_0_0_1px_var(--color-ink)]"
        />
        <button
          type="button"
          className="font-headline text-sm font-bold tracking-[0.1em] uppercase px-5 py-2.5 border-2 border-ink border-t-0 sm:border-t-2 bg-ink text-paper cursor-pointer whitespace-nowrap transition-colors duration-150 hover:bg-paper hover:text-ink"
        >
          Transcribe
        </button>
      </div>
    </div>
  );
}
