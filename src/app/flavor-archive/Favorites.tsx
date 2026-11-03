'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Heart } from 'lucide-react';

const STORAGE_KEY = 'chunki-chip-archive-favorites-v1';
type FavoritesState = {
  favorites: string[];
  ready: boolean;
  onlyFavorites: boolean;
  setOnlyFavorites: (value: boolean) => void;
  toggle: (name: string) => void;
  storageError: boolean;
};
const FavoritesContext = createContext<FavoritesState | null>(null);
function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('Favorites provider missing');
  return context;
}

export function ArchiveFavoritesProvider({ names, children }: { names: string[]; children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    function readFavorites() {
      try {
        const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        setFavorites(Array.isArray(value) ? [...new Set(value.filter((name): name is string => typeof name === 'string' && names.includes(name)))] : []);
        setStorageError(false);
      } catch { setStorageError(true); }
      setReady(true);
    }
    readFavorites();
    function sync(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) readFavorites();
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [names]);
  function toggle(name: string) {
    if (!ready || !names.includes(name)) return;
    const next = favorites.includes(name) ? favorites.filter((value) => value !== name) : [...favorites, name];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
    setFavorites(next);
  }
  return <FavoritesContext.Provider value={{ favorites, ready, onlyFavorites, setOnlyFavorites, toggle, storageError }}>{children}</FavoritesContext.Provider>;
}

export function FavoriteButton({ name }: { name: string }) {
  const { favorites, ready, toggle } = useFavorites();
  const saved = favorites.includes(name);
  return (
    <button type="button" disabled={!ready} onClick={() => toggle(name)} aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${name} ${saved ? 'from' : 'to'} favorites`} className={`mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eb2327] disabled:opacity-50 ${saved ? 'bg-[#ffccef] text-[#a20f16]' : 'soft-inset bg-white text-[#eb2327] hover:bg-[#fff1fa]'}`}>
      <Heart size={19} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {saved ? 'Favorited' : 'Favorite'}
    </button>
  );
}

export function FavoritesToolbar() {
  const { favorites, ready, onlyFavorites, setOnlyFavorites, storageError } = useFavorites();
  return (
    <div className="mt-7">
      <div className="flex flex-wrap gap-3" aria-label="Filter archive flavors">
        <button type="button" aria-pressed={!onlyFavorites} onClick={() => setOnlyFavorites(false)} className={`min-h-11 rounded-full px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#eb2327] ${!onlyFavorites ? 'bg-[#eb2327] text-white' : 'soft-card bg-white'}`}>All flavors</button>
        <button type="button" disabled={!ready} aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(true)} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#eb2327] disabled:opacity-50 ${onlyFavorites ? 'bg-[#eb2327] text-white' : 'soft-card bg-white'}`}><Heart size={17} aria-hidden="true" />My favorites ({favorites.length})</button>
      </div>
      <p className="mt-4 text-sm text-black/60">Tap a heart to save your favorites on this browser. No account needed.</p>
      <div role="status" aria-live="polite">
        {storageError && <p className="mt-3 text-sm text-[#a20f16]">Your browser could not save favorites. They will stay selected while this page is open.</p>}
        {ready && onlyFavorites && favorites.length === 0 && <div className="soft-inset mt-7 rounded-2xl bg-white p-8 text-center"><Heart size={32} className="mx-auto text-[#eb2327]" aria-hidden="true" /><h3 className="mt-4 text-xl font-bold">Your favorites start here.</h3><p className="mt-2 text-sm text-black/65">Choose All flavors and tap a heart on a cookie you love.</p></div>}
      </div>
    </div>
  );
}

export function FavoriteEntry({ name, className, children }: { name: string; className: string; children: ReactNode }) {
  const { favorites, onlyFavorites } = useFavorites();
  if (onlyFavorites && !favorites.includes(name)) return null;
  return <article className={className}>{children}</article>;
}

export function OtherFavoritesSection({ names, children }: { names: string[]; children: ReactNode }) {
  const { favorites, onlyFavorites } = useFavorites();
  if (onlyFavorites && !names.some((name) => favorites.includes(name))) return null;
  return <>{children}</>;
}
