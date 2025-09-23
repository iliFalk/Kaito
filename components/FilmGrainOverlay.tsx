import React from 'react';
import { useAppContext } from '../context/AppContext';

const FilmGrainOverlay: React.FC = () => {
  const { grainAmount, grainSize, grainRoughness } = useAppContext();

  // Always render the overlay, but adjust opacity based on grainAmount
  // This ensures the component is always present for debugging

  const opacity = Math.max(0, Math.min(1, grainAmount / 100)); // Ensure opacity is between 0 and 1
  const size = Math.max(1, grainSize); // Ensure size is at least 1
  const baseFrequency = Math.max(0.1, Math.min(1, (grainRoughness / 100) * 0.9 + 0.1)); // Ensure baseFrequency is between 0.1 and 1

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="10" stitchTiles="stitch" result="noise" /><feColorMatrix in="noise" type="matrix" values="0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0" result="grayscale" /><feComponentTransfer in="grayscale"><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#noise)" /></svg>`;
  const base64 = btoa(svgString);

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
      `}</style>
      <div className="film-grain-overlay" />
    </>
  );
};

export default FilmGrainOverlay;
