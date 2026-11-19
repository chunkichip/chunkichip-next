import { useEffect, useRef, useState } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Minus, Plus, ShoppingBag, Cookie, Check, MapPin, Trash2, ChevronLeft } from 'lucide-react';
import { SITE, type Product } from './catalog';
import { CART_KEY, MAX_BOXES, boxSize, boxFlavors, boxPrice, selectionIssue, readBag, checkoutItems, paymentUrl, money, type BagItem } from './ordering';

type Pickup = { locationId: string; locationName: string; timezone: string; locations: {id:string;name:string}[]; slots: {at:string;date:string;time:string}[]; hoursLabel?:string };
type Props = { products: Product[]; cached: boolean; onClose: () => void; initialProductId?: string; initialFlavorName?: string; bag: BagItem[]; setBag: (bag: BagItem[]) => void; ready: boolean };
const normalize = (s:string) => s.toLowerCase().replace(/[^a-z0-9]/g,'');

export function useBag() {
  const [bag, setBagState] = useState<BagItem[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError,setStorageError] = useState('');
  const queue = useRef(Promise.resolve());
  useEffect(() => { let active = true; Preferences.get({key:CART_KEY}).then(({value}) => { if(active) setBagState(readBag(value ? JSON.parse(value) : [])); }).catch(() => { if(active) setStorageError('Your saved bag could not be loaded.'); }).finally(() => { if(active) setReady(true); }); return () => {active=false;}; }, []);
  function setBag(next: BagItem[]) {
    setBagState(next);
    queue.current = queue.current.then(() => Preferences.set({key:CART_KEY,value:JSON.stringify(next)})).then(() => setStorageError('')).catch(() => setStorageError('Your bag could not be saved on this device. Keep the app open and try again.'));
  }
  return { bag, setBag, ready, storageError };
}

export default function Ordering({ products, cached, onClose, initialProductId, initialFlavorName, bag, setBag, ready }: Props) {
  const boxes = products.filter(p => [1,2,4,6,12].includes(boxSize(p))).sort((a,b) => boxSize(b)-boxSize(a));
  const [view,setView] = useState<'build'|'bag'>(initialProductId || initialFlavorName ? 'build' : 'bag');
  const [productId,setProductId] = useState(initialProductId || boxes.find(b => boxSize(b)===6)?.id || boxes[0]?.id || '');
  const [selected,setSelected] = useState<string[]>([]);
  const [editing,setEditing] = useState<string|null>(null);
  const [message,setMessage] = useState('');
  const [method,setMethod] = useState<'pickup'|'curbside'>('pickup');
  const [locationId,setLocationId] = useState('');
  const [pickup,setPickup] = useState<Pickup|null>(null);
  const [pickupLoading,setPickupLoading] = useState(false);
  const [pickupError,setPickupError] = useState('');
  const [pickupRetry,setPickupRetry] = useState(0);
  const [at,setAt] = useState('');
  const [busy,setBusy] = useState(false);
  const [payment,setPayment] = useState('');
  const [giftCard,setGiftCard] = useState(false);
  const [checkin,setCheckin] = useState('');
  const panel = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const product = boxes.find(p => p.id === productId);
  const flavors = product ? boxFlavors(product) : [];
  const size = product ? boxSize(product) : 0;
  const total = bag.reduce((sum,item) => { const p=products.find(p=>p.id===item.productId); return sum+(p?boxPrice(p,item.flavors)*item.quantity:0); },0);
  const bagIssue = bag.map(item => selectionIssue(products.find(p=>p.id===item.productId),item.flavors)).find(Boolean);
  const validPickup = pickup?.slots.some(slot=>slot.at===at);
  const pickupDate = pickup?.slots.find(slot=>slot.at===at)?.date || '';
  const pickupDates = [...new Set(pickup?.slots.map(slot=>slot.date) || [])];
  useEffect(() => { const prior = document.body.style.overflow; document.body.style.overflow='hidden'; panel.current?.showModal(); return () => {document.body.style.overflow=prior;}; }, []);
  useEffect(() => { panel.current?.scrollTo(0,0); heading.current?.focus(); },[view]);
  useEffect(() => {
    if (initialFlavorName && product) {
      const flavor=boxFlavors(product).find(f=>normalize(f.name)===normalize(initialFlavorName) && !f.soldOut);
      if (flavor) setSelected([flavor.id]);
    }
  }, []);
  useEffect(() => {
    if (view!=='bag' || !bag.length) return;
    const controller=new AbortController(); setPickupLoading(true);setPickupError('');setPickup(null);setAt('');
    fetch(`${SITE}/api/pickup-options${locationId?`?locationId=${encodeURIComponent(locationId)}`:''}`,{cache:'no-store',signal:controller.signal})
      .then(async response=> { const data=await response.json();if(!response.ok || !Array.isArray(data.slots))throw new Error('Pickup times could not load. Try again.');return data as Pickup; })
      .then(data=>{ if(!controller.signal.aborted){setPickup(data);setAt(data.slots[0]?.at || '');} })
      .catch(()=>{if(!controller.signal.aborted)setPickupError('Pickup times could not load. Check your connection and try again.');})
      .finally(()=>{if(!controller.signal.aborted)setPickupLoading(false);});
    return ()=>controller.abort();
  },[view,locationId,pickupRetry,bag.length>0]);
  useEffect(()=>{setPayment('');setCheckin('');},[bag,at,method,giftCard]);
  function chooseBox(id:string) {setProductId(id);setSelected([]);setMessage('');}
  function addFlavor(id:string) {if(selected.length<size){setSelected([...selected,id]);setMessage('');}}
  function removeFlavor(id:string) { const index=selected.lastIndexOf(id); if(index>=0)setSelected(selected.filter((_,i)=>i!==index));setMessage(''); }
  function saveBox() {
    if(!product || !ready)return;
    const issue=selectionIssue(product,selected);if(issue){setMessage(issue);return;}
    if(cached){setMessage('Reconnect and refresh the menu before adding this box.');return;}
    if(!editing && bag.length>=MAX_BOXES){setMessage('Your bag is full. Review your boxes to continue.');return;}
    const next = editing ? bag.map(item=>item.key===editing?{...item,productId,flavors:[...selected]}:item) : [...bag,{key:crypto.randomUUID(),productId,flavors:[...selected],quantity:1}];
    setBag(next);setEditing(null);setSelected([]);setView('bag');setMessage(editing?'Box updated.':'Box added to your bag.');
  }
  function edit(item:BagItem) {setProductId(item.productId);setSelected(item.flavors);setEditing(item.key);setView('build');setMessage('');}
  function quantity(key:string,delta:number) {setBag(bag.map(item=>item.key===key?{...item,quantity:Math.min(MAX_BOXES,item.quantity+delta)}:item).filter(item=>item.quantity>0));setMessage('');}
  async function preparePayment() {
    if(busy || !pickup || !validPickup || cached)return;
    setBusy(true);setMessage('');setPayment('');
    try {
      // Re-read the catalog before sending catalog IDs to the existing checkout.
      const response=await fetch(`${SITE}/api/products`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('We couldn’t check availability. Refresh the menu and try again.');
      const latest=await response.json();if(!Array.isArray(latest))throw new Error('The menu could not be verified. Please try again.');
      for (const item of bag) {
        const old=products.find(p=>p.id===item.productId), fresh=latest.find((p:Product)=>p.id===item.productId);
        if(old && fresh && boxPrice(old,item.flavors)!==boxPrice(fresh,item.flavors))throw new Error('Pricing has changed. Close your bag and refresh the menu before continuing.');
      }
      const items=checkoutItems(bag,latest);
      const result=await fetch(`${SITE}/api/create-checkout`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items,checkoutMethod:method,locationId:pickup.locationId,pickupAt:at,giftCardCheckout:giftCard})});
      const data=await result.json();if(!result.ok)throw new Error(data.error || 'Could not start payment. Please try again.');
      setPayment(paymentUrl(data.url));
      if(data.curbsideCheckinUrl){const link=new URL(data.curbsideCheckinUrl);if(link.origin===SITE){setCheckin(link.href);await Preferences.set({key:'chunki-curbside-checkin',value:link.href}).catch(()=>{});}}
    } catch(error) {setMessage(error instanceof Error?error.message:'Could not start payment. Please try again.');} finally {setBusy(false);}
  }
  async function openPayment(url:string) {
    try { if(Capacitor.isNativePlatform())await Browser.open({url,toolbarColor:'#ffccef',presentationStyle:'fullscreen'});else window.open(url,'_blank','noopener,noreferrer'); }
    catch {setMessage('Payment could not open. Please try again.');}
  }
  return <dialog className="order-screen" ref={panel} aria-labelledby="order-heading" onCancel={event=>{if(busy){event.preventDefault();return;}onClose();}} onClose={onClose}>
    <header className="order-header"><button className="icon-button" aria-label="Close ordering" onClick={onClose} disabled={busy}><ChevronLeft/></button><span>CHUNKI CHIP</span><button className="icon-button bag-switch" aria-label={`View bag, ${bag.reduce((n,i)=>n+i.quantity,0)} boxes`} onClick={()=>{setView('bag');setMessage('');}} disabled={busy}><ShoppingBag size={21}/><b>{bag.reduce((n,i)=>n+i.quantity,0)}</b></button></header>
    <div className="order-body">
      <p className="eyebrow">{view==='build'?'Made your way':'Your cookie situation'}</p>
      <h1 id="order-heading" tabIndex={-1} ref={heading}>{view==='build'?'BUILD YOUR BOX.':'IN THE BAG.'}</h1>
      <p className="order-intro">{view==='build'?'Pick a size. Mix your favorites. Make it yours.':'Your boxes, your favorites. Ready when you are.'}</p>
      {message && <p role="status" className="message">{message}</p>}
      {cached && <p role="alert" className="message">You’re viewing a saved menu. Close ordering and refresh when connected before adding boxes or paying.</p>}
      {view==='build' ? <>
        {!boxes.length ? <div className="empty"><Cookie size={40}/><p>Boxes are unavailable. Close ordering and refresh the menu.</p></div> : <>
          <fieldset className="size-picker"><legend>CHOOSE YOUR BOX</legend><div>{boxes.map(box=><button type="button" key={box.id} aria-pressed={box.id===productId} onClick={()=>chooseBox(box.id)}><strong>{boxSize(box)}</strong><span>{money(box.priceAmount||0)}</span></button>)}</div></fieldset>
          <div className="box-visual" aria-label={`${selected.length} of ${size} cookies selected`}>
            <div className="box-lid"><span>OH, THAT’S</span><strong>CHUNKI.</strong></div>
            <div className={`box-slots slots-${size}`}>{Array.from({length:size},(_,index)=>{const flavor=flavors.find(f=>f.id===selected[index]);return <div key={index} className={flavor?'filled':''}>{flavor ? <button aria-label={`Remove ${flavor.name} from box`} onClick={()=>{setSelected(selected.filter((_,i)=>i!==index));setMessage('');}}>{flavor.imageUrl?<img src={flavor.imageUrl} alt={flavor.name}/>:<Cookie/>}</button>:<Cookie size={28} strokeWidth={1}/>}</div>;})}</div>
          </div>
          <div className="pick-progress"><h2>PICK YOUR FLAVORS</h2><span aria-live="polite">{selected.length} / {size}</span></div><div className="progress-track"><div style={{width:`${size?selected.length/size*100:0}%`}}/></div>
          <div className="builder-flavors">{flavors.map(flavor=>{const count=selected.filter(id=>id===flavor.id).length;return <article key={flavor.id} className={flavor.soldOut?'unavailable':''}><div className="builder-image">{flavor.imageUrl?<img src={flavor.imageUrl} alt=""/>:<Cookie size={46}/>}</div><div className="builder-name"><h3>{flavor.name}</h3>{flavor.soldOut?<small>Sold out</small>:Boolean(flavor.priceAmount)&&<small>+{money(flavor.priceAmount!)}</small>}</div><div className="stepper"><button aria-label={`Remove one ${flavor.name}`} disabled={!count} onClick={()=>removeFlavor(flavor.id)}><Minus size={17}/></button><span aria-live="polite">{count}</span><button aria-label={`Add one ${flavor.name}`} disabled={flavor.soldOut || selected.length>=size || cached} onClick={()=>addFlavor(flavor.id)}><Plus size={17}/></button></div></article>;})}</div>
          <div className="order-sticky"><div><small>YOUR {size} COOKIE BOX</small><strong>{product?money(boxPrice(product,selected)):''}</strong></div><button className="primary" disabled={!ready || cached || selected.length!==size || !!selectionIssue(product,selected)} onClick={saveBox}>{selected.length===size?<><Check size={18}/>{editing?'Save box':'Add to bag'}</>:`Pick ${Math.max(0,size-selected.length)} more`}</button></div>
        </>}
      </> : <>
        {!ready?<p role="status">Loading your bag…</p>:!bag.length?<div className="empty bag-empty"><ShoppingBag size={50}/><h2>GOOD THINGS GO HERE.</h2><p>Start with a box. Fill it with your favorites.</p></div>:<div className="bag-items">{bag.map(item=>{const p=products.find(p=>p.id===item.productId);const options=p?boxFlavors(p):[];return <article className="bag-item" key={item.key}><div className="bag-item-heading"><h2>{p?.name || 'Unavailable box'}</h2><strong>{p?money(boxPrice(p,item.flavors)*item.quantity):'Unavailable'}</strong></div><div className="bag-thumbs">{item.flavors.map((id,i)=>{const f=options.find(f=>f.id===id);return f?.imageUrl?<img key={i} src={f.imageUrl} alt=""/>:<Cookie key={i} size={25}/>;})}</div><p>{[...new Set(item.flavors)].map(id=>`${item.flavors.filter(value=>value===id).length} × ${options.find(f=>f.id===id)?.name || 'Unavailable flavor'}`).join(' · ')}</p>{selectionIssue(p,item.flavors)&&<p className="item-error">{selectionIssue(p,item.flavors)}</p>}<div className="bag-item-actions"><button className="text-button" onClick={()=>edit(item)} disabled={busy}>Edit box</button><button className="icon-button" aria-label={`Remove ${p?.name||'box'} from bag`} onClick={()=>setBag(bag.filter(b=>b.key!==item.key))} disabled={busy}><Trash2 size={18}/></button><div className="stepper"><button aria-label={`Decrease ${p?.name||'box'} quantity`} onClick={()=>quantity(item.key,-1)} disabled={busy}><Minus size={17}/></button><span>{item.quantity}</span><button aria-label={`Increase ${p?.name||'box'} quantity`} onClick={()=>quantity(item.key,1)} disabled={busy || item.quantity>=MAX_BOXES}><Plus size={17}/></button></div></div></article>;})}</div>}
        <button className="secondary add-box" onClick={()=>{setEditing(null);setSelected([]);setView('build');setMessage('');}} disabled={busy || !ready}><Plus size={18}/>{bag.length?'Build another box':'Build your first box'}</button>
        {bag.length>0 && <section className="pickup-section"><div className="section-heading"><h2>PICK YOUR PICKUP.</h2><MapPin size={23}/></div>
          <fieldset disabled={busy}><legend>Pickup method</legend><div className="method-picker">{(['pickup','curbside'] as const).map(value=><label className={method===value?'active':''} key={value}><input type="radio" name="method" value={value} checked={method===value} onChange={()=>setMethod(value)}/>{value==='pickup'?'Carry out':'Curbside'}</label>)}</div></fieldset>
          {pickupLoading?<p className="muted" role="status">Finding pickup times…</p>:pickupError?<div role="alert"><p>{pickupError}</p><button className="text-button" onClick={()=>setPickupRetry(n=>n+1)}>Try again</button></div>:pickup&&<>
            {pickup.locations.length>1?<label className="order-field">Pickup location<select value={pickup.locationId} disabled={busy} onChange={e=>setLocationId(e.target.value)}>{pickup.locations.map(location=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label>:<p className="location-label">{pickup.locationName}</p>}
            <label className="order-field">Pickup date<select value={pickupDate} disabled={busy || !pickup.slots.length} onChange={e=>setAt(pickup.slots.find(slot=>slot.date===e.target.value)?.at || '')}>{!pickupDates.length&&<option value="">No dates available</option>}{pickupDates.map(date=><option key={date} value={date}>{new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'long',month:'short',day:'numeric'}).format(new Date(date+'T12:00:00Z'))}</option>)}</select></label>
            <label className="order-field">Pickup time <span>(shop local time)</span><select value={at} disabled={busy || !pickup.slots.length} onChange={e=>setAt(e.target.value)}>{!pickup.slots.length&&<option value="">No pickup times available</option>}{pickup.slots.filter(slot=>slot.date===pickupDate).map(slot=><option key={slot.at} value={slot.at}>{new Intl.DateTimeFormat('en-US',{timeZone:pickup.timezone,hour:'numeric',minute:'2-digit'}).format(new Date(slot.at))}</option>)}</select></label>
            {pickup.hoursLabel&&<p className="muted">{pickup.hoursLabel}</p>}
          </>}
          <label className="gift-option"><input type="checkbox" checked={giftCard} disabled={busy} onChange={e=>setGiftCard(e.target.checked)}/>Pay with a Chunki Chip gift card</label>
          <div className="bag-total"><span>Subtotal</span><strong>{money(total)}</strong></div><p className="muted">Taxes and any available rewards are confirmed at payment. These boxes are for pickup. Shipping and delivery are available through the Visit tab.</p>
          {payment?<div className="payment-ready"><Check size={25}/><h3>READY FOR PAYMENT.</h3><p>Your boxes and pickup time have been sent to secure checkout.</p><button className="primary" onClick={()=>void openPayment(payment)}>Open secure payment</button>{checkin&&<button className="text-button" onClick={()=>void openPayment(checkin)}>Open curbside check-in after payment</button>}<p className="muted">Your bag stays here when payment opens. After paying, use “Clear bag after purchase” to start fresh.</p><button className="text-button" onClick={()=>{setBag([]);setPayment('');setMessage('Bag cleared.');}}>Clear bag after purchase</button></div>:<button className="primary checkout-button" onClick={()=>void preparePayment()} disabled={busy || cached || !!bagIssue || !validPickup || pickupLoading}>{busy?'Preparing secure checkout…':'Continue to payment'}</button>}
          {method==='curbside'&&<p className="muted">After payment, use your check-in link when you arrive at the shop.</p>}
        </section>}
      </>}
    </div>
  </dialog>;
}
