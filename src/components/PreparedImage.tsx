import type { ImgHTMLAttributes } from 'react';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & { src: string; alt: string };
const widths = [320, 640, 960, 1280, 1920];

/** Static build-time variants: preserve responsive sizing without /_next/image. */
export default function PreparedImage({ src, alt, loading = 'lazy', decoding = 'async', ...props }: Props) {
  const prepared = /^\/boxes\/(1|2|4|6|12)-box\.png$/.test(src) || src === '/open-shipping-box.webp';
  const stem = `/prepared${src.replace(/\.[^.]+$/, '')}`;
  // Build-time srcSet variants intentionally replace the runtime image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} loading={loading} decoding={decoding}
    src={prepared ? `${stem}-960.webp` : src}
    srcSet={prepared ? widths.map(width => `${stem}-${width}.webp ${width}w`).join(', ') : undefined}
  />;
}
