'use client';

import {useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';

const photos = [
  {src: '/thanksgiving-platter-main.webp', alt: 'Thanksgiving cookie platter with a red ribbon and holiday sticker'},
  {src: '/thanksgiving-platter-uncovered.webp', alt: 'Uncovered Chunki Chip cookie platter viewed from the side'},
  {src: '/thanksgiving-platter-closed.webp', alt: 'Chunki Chip cookie platter with its clear lid closed'},
  {src: '/thanksgiving-platter-open.webp', alt: 'Chunki Chip cookie platter with the clear lid lifted'},
];

export default function PlatterGallery() {
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function show(index: number) {
    const target = (index + photos.length) % photos.length;
    viewport.current?.scrollTo({
      left: target * viewport.current.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return <div className="mt-7" role="region" aria-label="Thanksgiving platter photo gallery">
    <div className="soft-card relative overflow-hidden bg-white">
      <div ref={viewport} className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" tabIndex={0} aria-label="Platter photos. Swipe or use the arrow keys to browse."
        onScroll={() => {if (viewport.current) setActive(Math.round(viewport.current.scrollLeft / viewport.current.clientWidth));}}
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            show(active + (event.key === 'ArrowRight' ? 1 : -1));
          }
        }}>
        {photos.map((photo, index) => <div key={photo.src} className="aspect-square w-full shrink-0 snap-center">
          {/* Static assets avoid runtime image processing on the storefront. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt} width={1080} height={1080} loading={index === 0 ? 'eager' : 'lazy'} draggable={false} className="h-full w-full object-contain"/>
        </div>)}
      </div>
      <button type="button" onClick={() => show(active - 1)} aria-label="Previous platter photo" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-3 shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eb2327]"><ChevronLeft size={22} aria-hidden="true"/></button>
      <button type="button" onClick={() => show(active + 1)} aria-label="Next platter photo" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-3 shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eb2327]"><ChevronRight size={22} aria-hidden="true"/></button>
      <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold" aria-live="polite" aria-atomic="true">{active + 1} / {photos.length}</span>
    </div>
    <div className="mt-4 grid grid-cols-4 gap-3" aria-label="Choose a platter photo">
      {photos.map((photo, index) => <button key={photo.src} type="button" onClick={() => show(index)} aria-label={`View platter photo ${index + 1}: ${photo.alt}`} aria-pressed={active === index} className={`overflow-hidden rounded-2xl border-2 bg-white p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eb2327] ${active === index ? 'border-[#eb2327]' : 'border-transparent'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt="" width={108} height={108} loading="lazy" className="aspect-square w-full object-contain"/>
      </button>)}
    </div>
  </div>;
}
