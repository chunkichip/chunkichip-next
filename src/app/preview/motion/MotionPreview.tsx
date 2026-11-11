'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Pause, Play } from 'lucide-react';
import type { CatalogFlavor } from '@/lib/catalog';
import ThisWeekOnlyBadge from '@/components/ThisWeekOnlyBadge';
import styles from './motion.module.css';
import FeatureSequence from './FeatureSequence';

export default function MotionPreview({ flavors }: { flavors: CatalogFlavor[] }) {
  const prefersReducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const still = Boolean(prefersReducedMotion || paused);
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const leftX = useTransform(scrollYProgress, [0, 1], ['0%', '-35%']);
  const rightX = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const cookieY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const rotation = useTransform(scrollYProgress, [0, 1], [-12, 22]);
  const reveal = still
    ? { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 45 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.65 } };

  return (
    <main className={styles.preview} data-still={still}>
      <div className={styles.previewBar}>
        <span>Design preview</span>
        <Link href="/">Current homepage <ArrowUpRight size={14} /></Link>
        <button type="button" aria-pressed={still} onClick={() => setPaused(!paused)} disabled={Boolean(prefersReducedMotion)}>
          {still ? <Play size={13} /> : <Pause size={13} />}
          {prefersReducedMotion ? 'Reduced motion' : still ? 'Play motion' : 'Pause motion'}
        </button>
      </div>

      <section ref={hero} className={styles.hero} aria-labelledby="motion-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Milford baked. Big cookie energy.</p>
            <h1 id="motion-title">OH, THAT’S<br /><span>CHUNKI.</span></h1>
            <p className={styles.heroDescription}>Big cookies. Weekly flavor drops.<br />Your next favorite is in the box.</p>
            <Link href="/#boxes" className={styles.button}>Build your box <ArrowUpRight size={20} /></Link>
            <a href="#featured-stories" className={styles.scrollCue}>Scroll for the good stuff <ArrowDown size={17} /></a>
            <a href="#motion-flavors" className={styles.allFlavors}>See all flavors <ArrowDown size={16} /></a>
          </div>
          <div className={styles.cookieStage} aria-label="A selection of Chunki Chip cookies">
            <span className={styles.backType} aria-hidden="true">COOKIE<br />OBSESSED.</span>
            <motion.img src="/archive/chai-frosted-sugar-isolated.webp" alt="Frosted sugar cookie" width={900} height={900} className={styles.cookieLeft} style={still ? {} : { x: leftX, y: cookieY }} />
            <motion.img src="/archive/m-m-isolated.webp" alt="Chunki Chip M&M cookie" width={900} height={900} fetchPriority="high" className={styles.cookieMain} style={still ? {} : { rotate: rotation, y: cookieY }} />
            <motion.img src="/archive/funfetti-brownie-isolated.webp" alt="Chocolate brownie cookie with sprinkles" width={900} height={900} className={styles.cookieRight} style={still ? {} : { x: rightX, y: cookieY }} />
            <span className={styles.photoNote}>A few from the cookie collection</span>
          </div>
        </div>
      </section>

      <div className={styles.marquee} aria-label="Oh, that’s Chunki. Baked in Milford. Pick your favorites.">
        <div className={styles.marqueeTrack} aria-hidden="true">
          {[0, 1].map(i => <span key={i}>OH, THAT’S CHUNKI. <b>✳</b> BAKED IN MILFORD. <b>✳</b> PICK YOUR FAVORITES. <b>✳</b> </span>)}
        </div>
      </div>

      <FeatureSequence flavors={flavors.filter(flavor => !flavor.soldOut)} still={still} />

      <section id="motion-flavors" className={styles.flavors}>
        <motion.div className={styles.sectionHeading} {...reveal}>
          <div><p className={styles.eyebrow}>The current lineup</p><h2>MEET YOUR<br /><span>WEEKLY FIX.</span></h2></div>
          <div><p>Fresh flavors. Familiar favorites.<br />Which ones are making your box?</p><Link href="/#menu">Explore the menu <ArrowUpRight size={18} /></Link></div>
        </motion.div>
        {flavors.length ? <ul className={styles.flavorDisplay} aria-label="This week’s cookie flavors">
          {flavors.map((flavor, index) => <li key={flavor.id} className={styles.flavorItem}>
            <article className={styles.flavorCard} aria-labelledby={`display-${flavor.id}`}>
            <div className={styles.flavorImage}>
              <span className={styles.flavorNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              {flavor.imageUrl ? <img src={flavor.imageUrl} alt={flavor.name} width={500} height={500} loading="lazy" /> : <span className={styles.noPhoto}>CHUNKI.</span>}
            </div>
            <div className={styles.flavorCopy}>
              <div className={styles.flavorLabels}>{flavor.thisWeekOnly && <ThisWeekOnlyBadge />}{flavor.soldOut && <span className={styles.soldOut}>Sold out</span>}</div>
              <h3 id={`display-${flavor.id}`}>{flavor.name}</h3>
              <p>{flavor.description || 'A fresh-baked Chunki Chip favorite.'}</p>
              {flavor.soldOut ? <span className={styles.unavailable}>Currently unavailable</span> : <Link className={styles.flavorOrder} href={`/product/${encodeURIComponent(flavor.id)}`} aria-label={`Order ${flavor.name}`}>Order this cookie <ArrowUpRight size={18} /></Link>}
            </div>
            </article>
          </li>)}
        </ul> : <p className={styles.emptyMenu}>This week’s menu is being refreshed. <Link href="/#menu">Check the live menu →</Link></p>}
      </section>

      <section className={styles.shipping}>
        <motion.div className={styles.shippingPhoto} {...reveal}><img src="/open-shipping-box.webp" alt="An open pink Chunki Chip shipping box filled with individually wrapped cookies" width={1536} height={861} loading="lazy" /></motion.div>
        <motion.div className={styles.shippingCopy} {...reveal}><p className={styles.eyebrow}>Cookie mail hits different</p><h2>BIG BOX.<br />BIGGER<br /><span>REACTION.</span></h2><p>Send a little Chunki to someone’s doorstep. Your favorites, individually wrapped and packed for the trip.</p><Link href="/#shipping-boxes" className={styles.button}>Ship a box <ArrowUpRight size={20} /></Link></motion.div>
      </section>

      <motion.section className={styles.finalCta} {...reveal}><p className={styles.eyebrow}>You’ve scrolled. Now pick.</p><h2>LET’S FILL<br />THAT BOX.</h2><Link href="/#boxes" className={styles.button}>Order cookies <ArrowUpRight size={22} /></Link><Link className={styles.backLink} href="/">Back to current homepage</Link></motion.section>
    </main>
  );
}
