import React from 'react';
import { useAppContext } from '../context/AppContext';

const FilmGrainOverlay: React.FC = () => {
  // Support both contexts:
  // - JS context exposes a single "filmGrain" slider (0..0.2)
  // - TS context exposes granular controls: grainAmount/Size/Roughness (0..100)
  const ctx = useAppContext() as any;

  const filmGrain: number | undefined = ctx.filmGrain;
  const grainAmount: number | undefined = ctx.grainAmount;
  const grainSize: number | undefined = ctx.grainSize;
  const grainRoughness: number | undefined = ctx.grainRoughness;

  // Opacity:
  // If filmGrain is present (0..0.2), scale to 0..1 for visibility.
  // Else, use grainAmount (0..100).
  const opacity = filmGrain !== undefined
    ? Math.max(0, Math.min(1, filmGrain * 5))
    : Math.max(0, Math.min(1, (grainAmount ?? 50) / 100));

  const size = Math.max(1, grainSize ?? 50);
  const baseFrequency = Math.max(0.1, Math.min(1, ((grainRoughness ?? 50) / 100) * 0.9 + 0.1));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="10" stitchTiles="stitch" result="noise" /><feColorMatrix in="noise" type="matrix" values="0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0" result="grayscale" /><feComponentTransfer in="grayscale"><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#noise)" /></svg>`;
  const encodedSvg = btoa(svg);

  return (
    <>
      <style>{`
        .film-grain-overlay {
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background-image: url('data:image/svg+xml;base64,${encodedSvg}');
          background-size: ${size}px ${size}px;
          pointer-events: none;
          z-index: 9999;
          opacity: ${opacity};
        }
      `}</style>
      <div className="film-grain-overlay" />
    </>
  );
};

export default FilmGrainOverlay;
