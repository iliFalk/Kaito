import React from 'react';
import { useAppContext } from '../context/AppContext.js';

const FilmGrainOverlay = () => {
  const { filmGrain, filmGrainSize } = useAppContext();

  if (filmGrain <= 0) {
    return null;
  }

  return (
    React.createElement(React.Fragment, null,
      React.createElement('style', null, `
        .film-grain-overlay {
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiPgo8ZmlsdGVyIGlkPSJub2lzZSI+CjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjciIG51bU9jdGF2ZXM9IjEwIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiAvPgo8L2ZpbHRlcj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgLz4KPC9zdmc+');
          background-size: ${filmGrainSize}px ${filmGrainSize}px;
          pointer-events: none;
          z-index: 9999;
          opacity: ${filmGrain};
        }
      `),
      React.createElement('div', { className: "film-grain-overlay" })
    )
  );
};

export default FilmGrainOverlay;
