'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import type { CatalogFlavor } from '@/lib/catalog';
import styles from './features.module.css';

type Scene = {
  id: string; title: string; description: string; eyebrow: string;
  image: string; imageAlt: string; href: string; action: string;
  kind: 'cookie' | 'box' | 'shipping' | 'rewards';
};

export default function FeatureSequence({ flavors, still }: { flavors: CatalogFlavor[]; still: boolean }) {
  const deck = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: deck, offset: ['start start', 'end end'] });
  const scenes: Scene[] = [
    ...flavors.filter(f => f.imageUrl).map(f => ({
      id: f.id, title: f.name, description: f.description || 'Your next favorite cookie. Pick your flavors and make it a box.',
      eyebrow: f.thisWeekOnly ? 'THIS WEEK ONLY' : 'MEET YOUR NEXT FAVORITE',
      image: f.imageUrl!, imageAlt: f.name, href: `/product/${encodeURIComponent(f.id)}`, action: 'Pick this flavor', kind: 'cookie' as const,
    })),
    { id: 'build-box', title: 'THE BOX\nIS YOURS.', description: 'Pick a size. Mix your favorites. We’ll handle the cookies.', eyebrow: 'YOUR FLAVORS. YOUR BOX.', image: '/boxes/6-box.png', imageAlt: 'Open red Chunki Chip six-cookie box', href: '/#boxes', action: 'Build your box', kind: 'box' },
    { id: 'cookie-mail', title: 'SEND\nSOME CHUNKI.', description: 'Individually wrapped cookies. A pink box worth opening. Shipped to their doorstep.', eyebrow: 'NATIONWIDE COOKIE MAIL', image: '/open-shipping-box.webp', imageAlt: 'An open pink Chunki Chip shipping box filled with cookies', href: '/#shipping-boxes', action: 'Ship a box', kind: 'shipping' },
    { id: 'cookie-rewards', title: 'GOOD TASTE.\nGREAT PERKS.', description: 'Your cookie habit has its perks. Join Chunki Chip Rewards and check your points.', eyebrow: 'CHUNKI CHIP REWARDS', image: '/archive/m-m-isolated.webp', imageAlt: 'Chunki Chip M&M cookie', href: '/rewards', action: 'See the perks', kind: 'rewards' },
  ];
  useMotionValueEvent(scrollYProgress, 'change', p => {
    const next = Math.min(scenes.length - 1, Math.max(0, Math.floor(p * scenes.length)));
    setActive(previous => previous === next ? previous : next);
  });
  const index = Math.min(active, scenes.length - 1);
  const scene = scenes[index];
  const theme = index % 4;

  function goToScene(next: number) {
    if (!deck.current) return;
    const top = deck.current.getBoundingClientRect().top + window.scrollY;
    const travel = deck.current.offsetHeight - window.innerHeight;
    // Land inside the scene's scroll interval, clear of its transition boundary.
    window.scrollTo({ top: top + ((next + 0.2) / scenes.length) * travel, behavior: still ? 'instant' : 'smooth' });
  }

  return (
    <section ref={deck} id="featured-stories" className={styles.sequence} style={{ height: `${scenes.length * 95}svh` }} aria-label="Full-screen cookie features" data-still={still}>
      <div className={styles.stage} data-theme={theme}>
        <div className={styles.topline}><span>THE CHUNKI COLLECTION</span><span>{String(index + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}</span></div>
        <AnimatePresence mode="sync" initial={false}>
          <motion.article
            key={scene.id}
            className={styles.scene}
            data-kind={scene.kind}
            data-layout={index % 3}
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: still ? 0 : 0.45 }}
          >
            <motion.div className={styles.backdrop} aria-hidden="true" initial={still ? false : { x: 90 }} animate={{ x: 0 }} transition={{ duration: still ? 0 : 0.9 }}>
              {scene.kind === 'cookie' ? scene.title : scene.kind === 'box' ? 'BOX IT UP.' : scene.kind === 'shipping' ? 'COOKIE MAIL.' : 'PERKS. PERKS.'}
            </motion.div>
            <div className={styles.art}>
              {(scene.kind === 'cookie' || scene.kind === 'rewards') && <>
                <img className={styles.echoOne} src={scene.image} alt="" aria-hidden="true" width={700} height={700} loading="lazy" />
                <img className={styles.echoTwo} src={scene.image} alt="" aria-hidden="true" width={700} height={700} loading="lazy" />
              </>}
              <motion.div className={styles.imageEntrance} initial={still ? false : { scale: 0.68, rotate: index % 2 ? 16 : -16, y: 100 }} animate={{ scale: 1, rotate: 0, y: 0 }} transition={{ duration: still ? 0 : 1, ease: [0.16, 1, 0.3, 1] }}>
                <img className={styles.mainImage} src={scene.image} alt={scene.imageAlt} width={900} height={900} loading="lazy" />
              </motion.div>
              <span className={styles.artLabel}>{scene.kind === 'cookie' ? 'PICK. MIX. REPEAT.' : scene.kind === 'box' ? 'MAKE IT A SIX.' : scene.kind === 'shipping' ? 'SIGNED, SEALED, CHUNKI.' : 'TREAT YOURSELF.'}</span>
            </div>
            <motion.div className={styles.copy} initial={still ? false : { y: 55, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: still ? 0 : 0.65, delay: still ? 0 : 0.12 }}>
              <p className={styles.eyebrow}>{scene.eyebrow}</p>
              <h2>{scene.title}</h2>
              <p className={styles.description}>{scene.description}</p>
              <Link href={scene.href} className={styles.action}>{scene.action} <ArrowUpRight size={21} /></Link>
            </motion.div>
          </motion.article>
        </AnimatePresence>
        <nav className={styles.dots} aria-label="Choose a featured story">
          {scenes.map((item, i) => <button key={item.id} type="button" aria-label={`Show ${item.title.replace(/\n/g, ' ')}`} aria-current={i === index ? 'step' : undefined} onClick={() => goToScene(i)}><span /></button>)}
        </nav>
        <div className={styles.bottomline}>
          <a href="#motion-flavors">Skip to all flavors <ArrowUpRight size={14} /></a>
          <span>KEEP SCROLLING <ArrowDown size={15} /></span>
        </div>
      </div>
    </section>
  );
}
