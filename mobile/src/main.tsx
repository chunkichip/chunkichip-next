import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { App as NativeApp } from '@capacitor/app';
import { Cookie, Heart, Gift, MapPin, ShoppingBag, RefreshCw, X, ExternalLink } from 'lucide-react';
import '@fontsource/anton/latin-400.css';
import { getWeeklyFlavors, isInPersonCookieBox, readProducts, SITE, storefrontUrl, type Product } from './catalog';
import './style.css';
import Ordering, { useBag } from './Ordering';
import './ordering.css';

type Tab = 'menu' | 'favorites' | 'rewards' | 'visit';
const tabs = [
  { id: 'menu', label: 'Cookies', icon: Cookie },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'visit', label: 'Visit', icon: MapPin },
] as const;
const FAVORITES_KEY = 'chunki-favorite-flavors-v1';
const MENU_KEY = 'chunki-menu-cache-v1';
const flavorKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

function App() {
  const { bag, setBag, ready: bagReady, storageError } = useBag();
  const [order, setOrder] = useState<{ productId?: string; flavorName?: string } | null>(null);
  const [tab, setTab] = useState<Tab>('menu');
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updated, setUpdated] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef(0);
  const saveQueue = useRef(Promise.resolve());

  async function loadMenu() {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${SITE}/api/products`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Menu unavailable');
      const menu = readProducts(await response.json());
      if (id !== requestId.current) return;
      const savedAt = new Date().toISOString();
      setProducts(menu); setUpdated(savedAt); setCached(false);
      // A storage failure must not replace a successful live menu with old data.
      await Preferences.set({ key: MENU_KEY, value: JSON.stringify({ products: menu, savedAt }) }).catch(() => {});
    } catch {
      if (id !== requestId.current) return;
      try {
        const { value } = await Preferences.get({ key: MENU_KEY });
        if (id !== requestId.current) return;
        if (!value) throw new Error('No cache');
        const saved = JSON.parse(value);
        setProducts(readProducts(saved.products)); setUpdated(saved.savedAt); setCached(true);
      } catch { setError('We couldn’t load this week’s cookies. Check your connection and try again.'); }
    } finally { if (id === requestId.current) setLoading(false); }
  }

  useEffect(() => {
    void loadMenu();
    Preferences.get({ key: FAVORITES_KEY }).then(({ value }) => {
      const saved: unknown = value ? JSON.parse(value) : [];
      if (Array.isArray(saved)) setFavorites(saved.filter((item): item is string => typeof item === 'string'));
    }).catch(() => {}).finally(() => setFavoritesReady(true));
    const resume = NativeApp.addListener('appStateChange', ({ isActive }) => { if (isActive) void loadMenu(); });
    return () => { requestId.current++; void resume.then(listener => listener.remove()); };
  }, []);

  useEffect(() => {
    const back = NativeApp.addListener('backButton', () => {
      if (order) setOrder(null);
      else if (selected) setSelected(null);
      else if (tab !== 'menu') setTab('menu');
      else void NativeApp.exitApp();
    });
    return () => { void back.then(listener => listener.remove()); };
  }, [selected, tab, order]);

  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    else if (!selected) dialog.current?.close();
  }, [selected]);

  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  function toggleFavorite(name: string) {
    const key = flavorKey(name);
    const next = favorites.includes(key) ? favorites.filter(item => item !== key) : [...favorites, key];
    setFavorites(next);
    saveQueue.current = saveQueue.current.then(() => Preferences.set({ key: FAVORITES_KEY, value: JSON.stringify(next) }))
      .catch(() => setNotice('Your favorites couldn’t be saved on this device. Please try again.'));
  }

  function buildBox(productId?: string, flavorName?: string) { setSelected(null); setOrder({ productId, flavorName }); }

  async function openShop(path: string) {
    if (opening) return;
    setOpening(true); setNotice('');
    try {
      const url = storefrontUrl(path);
      if (Capacitor.isNativePlatform()) await Browser.open({ url, toolbarColor: '#ffccef', presentationStyle: 'fullscreen' });
      else {
        // Hosted previews can be embedded in a frame. Open the storefront
        // separately so checkout navigation does not replace that frame.
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch { setNotice('We couldn’t open the shop. Please try again.'); }
    finally { setOpening(false); }
  }

  const flavors = getWeeklyFlavors(products);
  const visibleFlavors = tab === 'favorites' ? flavors.filter(flavor => favorites.includes(flavorKey(flavor.name))) : flavors;
  const selectedFlavor = flavors.find(flavor => flavor.id === selected);
  const boxes = products.filter(isInPersonCookieBox).sort((a, b) => parseInt(b.name) - parseInt(a.name));
  const showMenu = tab === 'menu' || tab === 'favorites';

  return <>
    <header className="header"><img src="/logo.png" alt="Chunki Chip" /><span>OH, THAT’S CHUNKI.</span><button className="icon-button header-bag" aria-label={`Open bag, ${bag.reduce((n,i)=>n+i.quantity,0)} boxes`} onClick={()=>setOrder({})}><ShoppingBag size={22}/><b>{bag.reduce((n,i)=>n+i.quantity,0)}</b></button><button className="icon-button" aria-label="Refresh menu" disabled={loading} onClick={() => void loadMenu()}><RefreshCw size={21} className={loading ? 'spin' : ''}/></button></header>
    <main id="main-content">
      {storageError && <p role="alert" className="message">{storageError}</p>}
      {notice && <p role="alert" className="message">{notice}</p>}
      {showMenu && <>
        <section className={`hero ${tab === 'favorites' ? 'favorite-hero' : ''}`}>
          <p className="eyebrow">{tab === 'favorites' ? 'Your cookie crushes' : 'Fresh-baked in New Hampshire'}</p>
          <h1>{tab === 'favorites' ? <>LOVE AT<br/>FIRST BITE.</> : <>YOUR BOX.<br/>YOUR RULES.</>}</h1>
          <p>{tab === 'favorites' ? 'Your saved favorites that are on the menu right now.' : 'Fresh cookies. Big decisions. Start with your favorites.'}</p>
          {tab === 'menu' && <button className="primary" disabled={opening} onClick={() => buildBox(boxes.find(box=>parseInt(box.name)===6)?.id)}><ShoppingBag size={19}/>Build your box</button>}
        </section>
        <section className="content">
          <div className="section-heading"><h2>{tab === 'favorites' ? 'YOUR FAVORITES' : 'THIS WEEK’S FLAVORS'}</h2><span>{visibleFlavors.length} flavors</span></div>
          {loading && <p role="status" className="loading"><span className="cookie-spinner"><img src="/spinner-pink.png" alt=""/><img src="/spinner-red.png" alt=""/></span>Refreshing the lineup…</p>}
          {error && <div role="alert" className="message"><p>{error}</p><button className="secondary" onClick={() => void loadMenu()}>Try again</button></div>}
          {cached && <p role="status" className="message">You’re viewing a saved menu{updated && !isNaN(Date.parse(updated)) ? ` from ${new Date(updated).toLocaleDateString()}` : ''}. Reconnect to confirm this week’s flavors and availability.</p>}
          {!loading && !error && visibleFlavors.length === 0 && <div className="empty"><Cookie size={40}/><h3>{tab === 'favorites' ? 'Find your next favorite.' : 'A fresh lineup is on the way.'}</h3><p>{tab === 'favorites' ? 'Tap a heart on the Cookies tab to save a flavor. Saved flavors appear here whenever they’re available.' : 'Check back soon or visit the shop online.'}</p>{tab === 'favorites' && <button className="secondary" onClick={() => setTab('menu')}>Explore cookies</button>}</div>}
          <div className="flavors">{visibleFlavors.map(flavor => <article className="flavor" key={flavor.id}>
            <button className="flavor-image" onClick={() => setSelected(flavor.id)} aria-label={`View ${flavor.name}`}>{flavor.imageUrl ? <img src={flavor.imageUrl} alt={flavor.name} loading="lazy"/> : <Cookie size={90}/>}</button>
            <button className={`heart ${favorites.includes(flavorKey(flavor.name)) ? 'saved' : ''}`} disabled={!favoritesReady} aria-label={`Save ${flavor.name} as a favorite`} aria-pressed={favorites.includes(flavorKey(flavor.name))} onClick={() => toggleFavorite(flavor.name)}><Heart size={22}/></button>
            <div className="flavor-copy">{flavor.thisWeekOnly && <span className="badge">THIS WEEK ONLY</span>}<h3><button onClick={() => setSelected(flavor.id)}>{flavor.name}</button></h3><p>{flavor.description}</p><button className="text-button" disabled={opening} onClick={() => buildBox(boxes.find(box=>parseInt(box.name)===6)?.id, flavor.name)}>Add to a box</button></div>
          </article>)}</div>
        </section>
        {tab === 'menu' && boxes.length > 0 && <section className="content box-section"><h2>MAKE IT A BOX.</h2><p>A little something. Or the whole lineup.</p><div className="boxes">{boxes.map(box => <button key={box.id} disabled={opening} onClick={() => buildBox(box.id)}><span>{parseInt(box.name)}</span><strong>cookie box</strong><small>{box.price}</small></button>)}</div></section>}
      </>}
      {tab === 'rewards' && <><section className="hero"><p className="eyebrow">Chunki Chip Rewards</p><h1>GOOD TASTE.<br/>GOOD PERKS.</h1><p>Your cookie habit has benefits.</p><Gift size={64}/></section><section className="content"><div className="panel"><h2>YOUR NEXT COOKIE STARTS HERE.</h2><p>Sign in securely to view your Square rewards balance, join the program, and see your available perks.</p><button className="primary" disabled={opening} onClick={() => void openShop('/rewards')}>View my rewards<ExternalLink size={17}/></button><p className="muted">Opens the secure Chunki Chip rewards page.</p></div></section></>}
      {tab === 'visit' && <><section className="hero"><p className="eyebrow">Come get your cookie fix</p><h1>SEE YOU<br/>AT THE SHOP.</h1></section><section className="content"><div className="panel"><MapPin size={32}/><h2>MILFORD, NH</h2><address>183 Elm St, Unit 8<br/>Milford, NH 03055</address><button className="primary" disabled={opening} onClick={() => void openShop('/contact')}>Directions & current hours</button><a className="secondary" href="tel:+16035548571">Call (603) 554-8571</a></div><div className="panel pink"><h2>COOKIES, DELIVERED.</h2><p>Send a box across the country or plan something sweet for your next gathering.</p><button className="text-button" disabled={opening} onClick={() => void openShop('/#shipping-boxes')}>Shop shipping boxes</button><button className="text-button" disabled={opening} onClick={() => void openShop('/catering')}>Explore catering</button></div></section></>}
      <footer><button onClick={() => void openShop('/privacy')}>Privacy</button><button onClick={() => void openShop('/terms')}>Terms</button><button onClick={() => void openShop('/allergy-notice')}>Allergy information</button><p>Favorites are saved on this device.</p></footer>
    </main>
    <nav aria-label="Main navigation" className="tab-bar">{tabs.map(({ id, label, icon: Icon }) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => { setSelected(null); setTab(id); }}><Icon size={23}/><span>{label}</span></button>)}</nav>
    {order && <Ordering products={products} cached={cached || !!error || loading} onClose={()=>setOrder(null)} initialProductId={order.productId} initialFlavorName={order.flavorName} bag={bag} setBag={setBag} ready={bagReady}/>}
    <dialog ref={dialog} aria-labelledby="flavor-title" onCancel={() => setSelected(null)} onClose={() => setSelected(null)}>
      <button className="close icon-button" aria-label="Close flavor details" onClick={() => setSelected(null)}><X/></button>
      {selectedFlavor && <><div className="detail-image">{selectedFlavor.imageUrl ? <img src={selectedFlavor.imageUrl} alt={selectedFlavor.name}/> : <Cookie size={96}/>}</div><div className="detail-copy">{selectedFlavor.thisWeekOnly && <span className="badge">THIS WEEK ONLY</span>}<h2 id="flavor-title">{selectedFlavor.name}</h2><p>{selectedFlavor.description}</p><button className="primary" disabled={opening} onClick={() => buildBox(boxes.find(box=>parseInt(box.name)===6)?.id, selectedFlavor.name)}>Add to a box</button><p className="muted">Availability and pricing are confirmed at checkout.</p></div></>}
    </dialog>
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
