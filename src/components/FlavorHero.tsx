'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { CatalogFlavor } from '@/lib/catalog';
import styles from './flavor-hero.module.css';

const SLIDE_DURATION = 3000;

export default function FlavorHero({ flavors }: { flavors: CatalogFlavor[] }) {
  const slides = flavors.filter(flavor => flavor.imageUrl);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const index = slides.length ? active % slides.length : 0;
  const scene = slides[index];
  const playing = !paused && !hovered && !focused && visible && slides.length > 1;

  useEffect(() => { setPaused(Boolean(reducedMotion)); }, [reducedMotion]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }, { threshold: 0.15 });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setActive(value => (value + 1) % slides.length), SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [playing, active, slides.length]);

  function select(next: number) {
    setActive((next + slides.length) % slides.length);
    setPaused(true);
  }

  return <section ref={root} className={styles.hero} aria-label="This week’s featured cookies" aria-roledescription="carousel" data-still={Boolean(reducedMotion)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <h1 className="sr-only">Chunki Chip Cookies in Milford, NH</h1>
    <div className={styles.stage} data-theme={index % 4}>
      <div className={styles.topline}>
        <span>THIS WEEK AT CHUNKI CHIP</span>
        {slides.length > 1 && <div className={styles.controls}>
          <span className={styles.counter}>{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
          <button type="button" aria-label="Previous flavor" onClick={() => select(index - 1)}><ChevronLeft size={19}/></button>
          <button type="button" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => { if (paused) { setFocused(false); setHovered(false); } setPaused(value => !value); }}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button>
          <button type="button" aria-label="Next flavor" onClick={() => select(index + 1)}><ChevronRight size={19}/></button>
        </div>}
      </div>
      {scene ? <AnimatePresence mode="wait" initial={false}>
        <motion.article key={scene.id} className={styles.scene} data-kind="cookie" data-layout={index % 3} aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${scene.name}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reducedMotion ? 0 : 0.35}}>
          <div className={styles.backdrop} aria-hidden="true">{scene.name}</div>
          <div className={styles.art}>
            <img className={styles.echoOne} src={scene.imageUrl!} alt="" aria-hidden="true" width={700} height={700}/>
            <img className={styles.echoTwo} src={scene.imageUrl!} alt="" aria-hidden="true" width={700} height={700}/>
            <motion.div className={styles.imageEntrance} initial={reducedMotion ? false : {scale:0.86,rotate:index % 2 ? 10 : -10,y:35}} animate={{scale:1,rotate:0,y:0}} transition={{duration:reducedMotion ? 0 : 0.8,ease:[0.16,1,0.3,1]}}>
              <img className={styles.mainImage} src={scene.imageUrl!} alt={scene.name} width={900} height={900} fetchPriority="high"/>
            </motion.div>
            <span className={styles.artLabel}>PICK. MIX. REPEAT.</span>
          </div>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>{scene.thisWeekOnly ? 'THIS WEEK ONLY' : 'MEET YOUR NEXT FAVORITE'}</p>
            <h2>{scene.name}</h2>
            <p className={styles.description}>{scene.description || 'Your next favorite cookie. Pick your flavors and make it a box.'}</p>
            <Link href={`/product/${encodeURIComponent(scene.id)}`} className={styles.action}>Pick this flavor <ArrowUpRight size={21}/></Link>
          </div>
        </motion.article>
      </AnimatePresence> : <div className={styles.fallback}><h2>OH, THAT’S CHUNKI.</h2><p>Big cookies. Fresh baked in Milford.</p><Link href="#boxes" className={styles.action}>Build your box <ArrowUpRight size={21}/></Link></div>}
      {slides.length > 1 && <nav className={styles.dots} aria-label="Choose a featured flavor">{slides.map((flavor,i) => <button key={flavor.id} type="button" aria-label={`Show ${flavor.name}`} aria-current={i===index ? 'true' : undefined} onClick={() => select(i)}><span/></button>)}</nav>}
      <div className={styles.bottomline}><a href="#single-cookies">See all flavors <ArrowDown size={14}/></a><a href="#boxes">Build your box <ArrowUpRight size={14}/></a></div>
    </div>
  </section>;
}
