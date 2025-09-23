import React from 'react';
import { useAppContext } from '../context/AppContext';

const FilmGrainOverlay: React.FC = () => {
  const { grainAmount, grainSize, grainRoughness } = useAppContext();

  if (grainAmount <= 0) {
    return null;
  }

  const opacity = grainAmount / 100;
  const size = grainSize;
  const baseFrequency = (grainRoughness / 100) * 0.9 + 0.1;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="10" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#noise)" /></svg>`;
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
