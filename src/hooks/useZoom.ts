import { useState, useCallback } from 'react';

export const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export function useZoom(initialScale: number = 1.0) {
  const [scale, setScale] = useState<number>(initialScale);

  const zoomIn = useCallback(() => {
    setScale((prev) => {
      const next = ZOOM_PRESETS.find((z) => z > prev + 0.05);
      return next !== undefined ? next : Math.min(prev + 0.25, 3.0);
    });
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const reversed = [...ZOOM_PRESETS].reverse();
      const next = reversed.find((z) => z < prev - 0.05);
      return next !== undefined ? next : Math.max(prev - 0.25, 0.3);
    });
  }, []);

  const fitWidth = useCallback((containerWidth: number, pageWidth: number) => {
    if (containerWidth <= 0 || pageWidth <= 0) return;
    const padding = 48; // Side paddings
    const targetScale = Math.max(0.4, Math.min(2.5, (containerWidth - padding) / pageWidth));
    setScale(targetScale);
  }, []);

  const fitPage = useCallback((containerHeight: number, pageHeight: number) => {
    if (containerHeight <= 0 || pageHeight <= 0) return;
    const padding = 64;
    const targetScale = Math.max(0.4, Math.min(2.5, (containerHeight - padding) / pageHeight));
    setScale(targetScale);
  }, []);

  return {
    scale,
    setScale,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,
    zoomPercent: Math.round(scale * 100),
  };
}
