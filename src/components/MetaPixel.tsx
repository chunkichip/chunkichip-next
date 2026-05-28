'use client';

import { useEffect } from 'react';

export default function MetaPixel() {
  useEffect(() => {
    async function loadPixel() {
      const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

      if (!pixelId) return;

      const ReactPixel = (await import('react-facebook-pixel')).default;

      ReactPixel.init(pixelId);
      ReactPixel.pageView();
    }

    loadPixel();
  }, []);

  return null;
}