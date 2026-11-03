'use client';
import { useEffect, useState } from 'react';
import { cmsClient } from '@/lib/cms-client';
import { getWeeklyFlavors, type CatalogFlavor, type CatalogFlavorProduct } from '@/lib/catalog';

const descriptionId = (name: string) => 'weekly-flavor-' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
export default function WeeklyFlavorEditor() {
  const [flavors, setFlavors] = useState<CatalogFlavor[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CatalogFlavor | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      const client = cmsClient();
      if (!client) { if (active) { setMessage('Site Manager is not connected.'); setLoading(false); } return; }
      try {
        const [response, saved] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products`, { cache: 'no-store' }),
          client.from('site_content').select('id,value').like('id', 'weekly-flavor-%'),
        ]);
        if (!response.ok) throw new Error('Could not load Square flavors. Please refresh to try again.');
        if (saved.error) throw new Error(saved.error.message);
        const products: CatalogFlavorProduct[] = await response.json();
        if (!Array.isArray(products)) throw new Error('Square returned an unexpected menu.');
        // Owners can edit current choices even when Square marks them sold out.
        const current = getWeeklyFlavors(products.map(product => ({ ...product, modifierSets: product.modifierSets?.map(set => ({ ...set, modifiers: set.modifiers?.map(flavor => ({ ...flavor, soldOut: false })) })) })));
        if (active) {
          setFlavors(current);
          setValues(Object.fromEntries((saved.data || []).map(row => [row.id, row.value])));
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Could not load flavors.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const client = cmsClient();
    if (!client || !editing || busy) return;
    setBusy(true); setMessage('');
    try {
      const id = descriptionId(editing.name);
      const value = draft.trim();
      const { error } = await client.from('site_content').upsert({ id, page: 'Weekly flavors', label: editing.name, value });
      if (error) throw new Error(error.message);
      setValues(previous => ({ ...previous, [id]: value }));
      setEditing(null);
      setMessage('Saved. Refresh the public menu to see your description.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save. Please try again.');
    } finally { setBusy(false); }
  }
  return <section aria-labelledby="weekly-editor-heading">
    <h2 id="weekly-editor-heading" className="brand-heading text-4xl">Weekly flavors</h2>
    <p className="my-4 text-sm leading-7">Choose a current Square flavor to edit its website description. It appears on the homepage, flavor page, and box builder. Names, photos, prices, and availability stay managed in Square.</p>
    <p role="status" className="my-4 font-semibold">{message}</p>
    {loading ? <p>Loading flavors…</p> : editing ? <form onSubmit={save} className="grid gap-4 rounded-2xl bg-white p-6">
      <h3 className="text-xl font-bold">{editing.name}</h3>
      <label className="font-bold">Description<textarea rows={6} maxLength={2000} value={draft} onChange={e => setDraft(e.target.value)} className="mt-2 block w-full border p-3 font-normal" /></label>
      <p className="text-xs">Leave blank to use the catalog’s default description.</p>
      <div className="flex gap-4"><button type="submit" disabled={busy} className="bg-[#eb2327] px-6 py-3 font-bold text-white">{busy ? 'Saving…' : 'Save description'}</button><button type="button" disabled={busy} onClick={() => setEditing(null)}>Back</button></div>
    </form> : <div className="grid gap-3">{flavors.length ? flavors.map(flavor => <button key={flavor.id} onClick={() => { setEditing(flavor); setDraft(values[descriptionId(flavor.name)] ?? flavor.description ?? ''); setMessage(''); }} className="rounded-xl bg-white p-5 text-left"><strong>{flavor.name}</strong><p className="mt-2 text-sm leading-6">{values[descriptionId(flavor.name)] || flavor.description || 'Add a description'}</p><span className="mt-3 block text-sm font-bold text-[#eb2327]">Edit description →</span></button>) : <p>No current cookie flavors were found. Check the flavor choices on your Square cookie boxes.</p>}</div>}
  </section>;
}
