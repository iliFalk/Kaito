import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ScreenshotOverlayProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const ScreenshotOverlay: React.FC<ScreenshotOverlayProps> = ({ onCapture, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    onClose();
  }, [onClose]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
      }
    };

    const startCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' } as any,
          audio: false,
        });
        streamRef.current = stream;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            cleanup();
            return;
          }
          
          const track = stream.getVideoTracks()[0];
          const { width, height } = track.getSettings();

          canvas.width = width || window.innerWidth;
          canvas.height = height || window.innerHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Stop the video stream once we have the frame, so the screen doesn't update.
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (err) {
        console.error("Screen capture cancelled or failed:", err);
        cleanup();
      }
    };

    startCapture();
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cleanup();
    };
  }, [cleanup]);

  const getClientCoordinates = (e: React.MouseEvent) => {
    return { x: e.clientX, y: e.clientY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSelecting(true);
    setStartPos(getClientCoordinates(e));
    if (selectionBoxRef.current) {
      selectionBoxRef.current.style.display = 'none';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPos || !selectionBoxRef.current) return;
    e.preventDefault();

    const currentPos = getClientCoordinates(e);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(startPos.x - currentPos.x);
    const height = Math.abs(startPos.y - currentPos.y);

    const box = selectionBoxRef.current;
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
    box.style.display = 'block';
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isSelecting || !startPos) {
      setIsSelecting(false);
      return;
    }
    e.preventDefault();
    setIsSelecting(false);

    const endPos = getClientCoordinates(e);

    const dpr = window.devicePixelRatio || 1;
    const rect = {
      x: Math.min(startPos.x, endPos.x) * dpr,
      y: Math.min(startPos.y, endPos.y) * dpr,
      w: Math.abs(startPos.x - endPos.x) * dpr,
      h: Math.abs(startPos.y - endPos.y) * dpr,
    };

    if (rect.w < 10 || rect.h < 10) {
        cleanup();
        return;
    }

    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas) {
        cleanup();
        return;
    }

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = rect.w;
    cropCanvas.height = rect.h;
    const cropCtx = cropCanvas.getContext('2d');
    
    if (!cropCtx) {
        cleanup();
        return;
    }

    cropCtx.drawImage(
      sourceCanvas,
      rect.x, rect.y, rect.w, rect.h,
      0, 0, rect.w, rect.h
    );

    cropCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
        onCapture(file);
      }
      cleanup();
    }, 'image/png');
  };
  
  const styles = `
    .screenshot-overlay-container {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: 2147483647;
      cursor: crosshair;
    }
    .screenshot-canvas {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
    }
    .selection-box {
      position: absolute;
      border: 1px solid rgba(255, 255, 255, 0.8);
      background-color: rgba(0, 123, 255, 0.2);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.5);
      display: none;
      pointer-events: none;
    }
    .overlay-instructions {
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        pointer-events: none;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div 
        className="screenshot-overlay-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="overlay-instructions">
            Click and drag to select an area, or press Esc to cancel
        </div>
        <canvas className="screenshot-canvas" ref={canvasRef} />
        <div className="selection-box" ref={selectionBoxRef} />
      </div>
    </>
  );
};

export default ScreenshotOverlay;