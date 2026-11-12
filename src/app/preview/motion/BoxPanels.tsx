'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { isInPersonCookieBox, isShippingOnlyProduct, type CatalogFlavor } from '@/lib/catalog';
import type { SeoProduct } from '@/lib/seo-catalog';
import styles from './box-panels.module.css';

const sizes = ['1','2','4','6','12'];
const slots: Record<string, [number, number][]> = {
  '1': [[51.85,57.25]],
  '2': [[40.9,54.25],[59.55,54.25]],
  '4': [[22,62],[41,62],[60,62],[78,62]],
  '6': [[27,53],[50,53],[73,53],[27,72],[50,72],[73,72]],
  '12': [48.45,63.2,77.98].flatMap(y => [21.85,40.65,59.4,78.15].map(x => [x,y] as [number,number])),
};

export default function BoxPanels({products,flavors}:{products:SeoProduct[];flavors:CatalogFlavor[]}) {
  const pickup = products.filter(p=>isInPersonCookieBox(p) && p.variationId && sizes.includes(p.boxSize || ''));
  const shipping = products.filter(p=>isShippingOnlyProduct(p) && p.variationId && ['6','12'].includes(p.boxSize || ''));
  const [pickupSize,setPickupSize] = useState('6');
  const [shippingSize,setShippingSize] = useState('6');
  const selectedPickup = pickup.find(p=>p.boxSize===pickupSize) || pickup[0];
  const selectedShipping = shipping.find(p=>p.boxSize===shippingSize) || shipping[0];
  const examples = flavors.filter(f=>f.imageUrl && !f.soldOut);

  function choices(boxes:SeoProduct[], selected:SeoProduct|undefined, select:(size:string)=>void, ship=false) {
    return <div role="group" aria-label={ship?'Shipping box size':'Pickup box size'} className={`${styles.choices} ${ship?styles.shippingChoices:''}`}>
      {(ship?['6','12']:sizes).map(size=>{
        const box=boxes.find(p=>p.boxSize===size);
        return <button key={size} type="button" aria-pressed={selected?.boxSize===size} aria-label={`${size} cookie box${box?'':', unavailable'}`} disabled={!box} onClick={()=>select(size)}>{ship?`${size} cookie box`:size}</button>;
      })}
    </div>;
  }
  return <section className={styles.sections} aria-label="Cookie boxes and nationwide shipping">
    <article id="preview-boxes" className={styles.panel} aria-labelledby="preview-boxes-title">
      <div className={styles.well}>
        <div className={styles.boxArt} key={selectedPickup?.boxSize || '6'}>
          <img src={`/boxes/${selectedPickup?.boxSize || '6'}-box.png`} width={1240} height={1240} alt={`Open ${selectedPickup?.boxSize || '6'} cookie Chunki Chip box`} className={styles.box}/>
          {examples.length>0 && slots[selectedPickup?.boxSize || '6'].map(([left,top],i)=><img key={i} src={examples[i%examples.length].imageUrl!} alt="" aria-hidden="true" className={styles.sampleCookie} style={{left:`${left}%`,top:`${top}%`,width:`${selectedPickup?.boxSize==='1'?17:selectedPickup?.boxSize==='6'?16:selectedPickup?.boxSize==='4'?15:14}%`}} width={180} height={180} loading="lazy"/>)}
        </div>
        <p className={styles.caption}>Sample assortment. Choose your flavors next.</p>
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Your flavors. Your box.</p>
        <h2 id="preview-boxes-title">BUILD YOUR BOX.</h2>
        <p>Pick your size. Choose your cookies.</p>
        {choices(pickup,selectedPickup,setPickupSize)}
        <div className={styles.selection} role="status"><span>{selectedPickup?.name || 'Cookie boxes'}</span><span>{selectedPickup?.price || ''}</span></div>
        <Link className={styles.action} href={selectedPickup?`/product/${encodeURIComponent(selectedPickup.id)}`:'/#boxes'}>Choose your cookies <ArrowUpRight size={21}/></Link>
        <p className={styles.note}>In-store pickup or curbside at our Milford shop.</p>
      </div>
    </article>
    <article id="preview-shipping" className={styles.panel} aria-labelledby="preview-shipping-title">
      <div className={`${styles.well} ${styles.photoWell}`}><img src="/open-shipping-box.webp" alt="An open pink Chunki Chip shipping box filled with individually wrapped cookies" width={1536} height={861} loading="lazy"/></div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Cookie mail hits different</p>
        <h2 id="preview-shipping-title">SEND SOME CHUNKI.</h2>
        <p>Your favorites, individually wrapped and packed for the trip. Nationwide shipping.</p>
        {choices(shipping,selectedShipping,setShippingSize,true)}
        <div className={styles.selection} role="status"><span>{selectedShipping?`${selectedShipping.boxSize} cookie shipping box`:'Shipping boxes'}</span><span>{selectedShipping?.price || ''}</span></div>
        <Link className={styles.action} href={selectedShipping?`/product/${encodeURIComponent(selectedShipping.id)}`:'/#shipping-boxes'}>Build a shipping box <ArrowUpRight size={21}/></Link>
        <p className={styles.note}>Shipping calculated at checkout.</p>
      </div>
    </article>
  </section>;
}
