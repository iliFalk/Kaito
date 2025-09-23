import React from 'react';
import { useAppContext } from '../context/AppContext';

const FilmGrainOverlay: React.FC = () => {
  // Support both state shapes:
  // - filmGrain (0..0.2) single slider
  // - grainAmount/Size/Roughness (0..100) three sliders
  const ctx: any = useAppContext();

  const filmGrain: number | undefined = ctx.filmGrain;
  const grainAmount: number | undefined = ctx.grainAmount;
  const grainSize: number | undefined = ctx.grainSize;
  const grainRoughness: number | undefined = ctx.grainRoughness;

  // Compute opacity
  const opacity = filmGrain !== undefined
    ? Math.max(0, Math.min(1, filmGrain * 5)) // scale 0..0.2 -> 0..1
    : Math.max(0, Math.min(1, (grainAmount ?? 50) / 100));

  // Always render overlay; opacity may be 0 if user turns it off
  const size = Math.max(1, grainSize ?? 50);
  const baseFrequency = Math.max(0.1, Math.min(1, ((grainRoughness ?? 50) / 100) * 0.9 + 0.1));

  // Use SVG noise to avoid shipping a massive base64 blob
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="10" stitchTiles="stitch" result="noise" /><feColorMatrix in="noise" type="matrix" values="0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0" result="grayscale" /><feComponentTransfer in="grayscale"><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#noise)" /></svg>`;
  const base64 = btoa(svg);

  return (
    <>
      <style>{`
        .film-grain-overlay {
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background-image: url('data:image/svg+xml;base64,${base64}');
          background-size: ${size}px ${size}px;
          pointer-events: none;
          z-index: 9999;
          opacity: ${opacity};
        }

        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }
      `}</style>
      <div className="film-grain-overlay" />
    </>
  );
};

export default FilmGrainOverlay;
