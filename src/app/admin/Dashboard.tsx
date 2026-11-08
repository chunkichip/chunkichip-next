'use client';
import { useEffect, useState } from 'react';
import { cmsClient } from '@/lib/cms-client';
import WeeklyFlavorEditor from './WeeklyFlavorEditor';

type Row = Record<string, unknown>;
const client = cmsClient();
const sections = {
  site_content: ['page', 'label', 'value'],
  archive_entries: ['name', 'description', 'image', 'visible', 'display_order'],
  job_openings: ['title', 'location', 'employment_type', 'description', 'is_active', 'display_order'],
  catering_requests: ['name','email','phone','event_date','event_type','quantity','fulfillment','details','status','created_at'],
  job_applications: ['applicant_name', 'email', 'phone', 'role', 'experience', 'created_at'],
};
type Section = keyof typeof sections;
const titles = { catering_requests: 'Catering requests', site_content: 'Page content', archive_entries: 'Flavor archive', job_openings: 'Job postings', job_applications: 'Applications' };

export default function Dashboard() {
  const [admin, setAdmin] = useState(false);
  const [weeklyMode, setWeeklyMode] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [section, setSection] = useState<Section>('site_content');
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  useEffect(() => {
    if (!client) return;
    client.auth.getUser().then(({ data }) => setAdmin(data.user?.app_metadata?.site_admin === true));
    const { data } = client.auth.onAuthStateChange((_event, session) => setAdmin(session?.user.app_metadata?.site_admin === true));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!admin || !client) return;
    let active = true;
    client.from(section).select('*').order(section === 'catering_requests' ? 'created_at' : 'id', { ascending: section !== 'catering_requests' }).then(({ data, error }) => {
      if (active) { setRows(data || []); if (error) setMessage(error.message); }
    });
    return () => { active = false; };
  }, [admin, section]);
  async function authenticate(e: React.FormEvent) {
    e.preventDefault();
    if (!client || busy) return;
    const ownerEmail = email.trim().toLowerCase();
    if (authMode === 'signup' && (ownerEmail !== 'felishamarkham@gmail.com' || password.length < 12)) {
      setMessage('Use your owner email and a password of at least 12 characters.');
      return;
    }
    setBusy(true); setMessage('');
    try {
      if (authMode === 'signup') {
        const { data, error } = await client.auth.signUp({ email: ownerEmail, password });
        if (error) { setMessage(`Account creation failed: ${error.message}`); return; }
        setPassword('');
        setMessage(data.session
          ? 'Account created. Owner permissions must be activated before you can edit the site.'
          : 'Signup submitted. If a confirmation email arrives, follow its instructions. Owner permissions must be activated before you can edit the site.');
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email: ownerEmail, password });
        setMessage(error
          ? (error.code === 'invalid_credentials' ? 'Unable to sign in with those details. If you have not created your account yet, choose Create owner account below.' : error.message)
          : (data.user?.app_metadata?.site_admin ? '' : 'Signed in. Owner permissions must be activated before you can edit the site.'));
        if (!error) setPassword('');
      }
    } catch {
      setMessage('Could not connect. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!client || !editing || section === 'job_applications') return;
    setBusy(true); setMessage('');
    const result = section === 'catering_requests'
      ? await client.from(section).update({ status: String(editing.status) }).eq('id', String(editing.id)).select().single()
      : await client.from(section).upsert(editing).select().single();
    const {data,error} = result;
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setRows(old => [...old.filter(row => row.id !== data.id), data]);
    setEditing(null); setMessage('Saved.');
  }
  async function upload(file: File) {
    if (!client || !editing) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setMessage('Choose a JPG, PNG or WebP under 10 MB.'); return; }
    setBusy(true);
    const path = `${crypto.randomUUID()}.${file.type.split('/')[1]}`;
    const { error } = await client.storage.from('site-images').upload(path, file);
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setEditing({ ...editing, [section === 'site_content' ? 'value' : 'image']: client.storage.from('site-images').getPublicUrl(path).data.publicUrl });
  }
  return <main className="min-h-screen bg-[#fff7fb] px-5 py-12 text-black"><div className="mx-auto max-w-5xl">
    <h1 className="brand-heading text-5xl">SITE MANAGER</h1>
    <p role="status" className="my-4 whitespace-pre-line">{!client ? 'Site manager is awaiting its Supabase connection settings.' : message}</p>
    {!admin ? <form onSubmit={authenticate} className="grid max-w-md gap-4 rounded-2xl bg-white p-6">
      <h2 className="text-xl font-bold">{authMode === 'signup' ? 'Create owner account' : 'Owner sign in'}</h2>
      {authMode === 'signup' && <p>Use felishamarkham@gmail.com and choose a new password with at least 12 characters.</p>}
      <label>Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="block w-full border p-3"/></label>
      <label>Password<input required minLength={authMode === 'signup' ? 12 : undefined} type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="block w-full border p-3"/></label>
      <button type="submit" disabled={busy || !client} className="bg-[#eb2327] p-3 font-bold text-white">{busy ? (authMode === 'signup' ? 'Creating account…' : 'Signing in…') : (authMode === 'signup' ? 'Create account' : 'Sign in')}</button>
      <button type="button" disabled={busy || !client} onClick={() => { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}>{authMode === 'signup' ? 'Already have an account? Sign in' : 'First time? Create owner account'}</button>
    </form> : <>
    <div className="my-6 flex flex-wrap gap-3"><button onClick={() => { setWeeklyMode(true); setEditing(null); setMessage(''); }} className={`rounded-full border px-4 py-3 ${weeklyMode ? 'bg-black text-white' : 'bg-white'}`}>Weekly flavors</button>{(Object.keys(sections) as Section[]).map(key => <button key={key} onClick={() => { setWeeklyMode(false); setSection(key); setEditing(null); setFilter(""); }} className={`rounded-full border px-4 py-3 ${!weeklyMode && section === key ? 'bg-black text-white' : 'bg-white'}`}>{titles[key]}</button>)}<button onClick={() => client?.auth.signOut()}>Sign out</button></div>
    {weeklyMode ? <WeeklyFlavorEditor /> : <>
    <p className="mb-4">Edit page wording, manage archived flavors, post jobs, and review applications. Menu products and prices are managed in Square.</p>
    {!editing ? <><label>Find an entry<input className="my-3 block w-full border bg-white p-3" value={filter} onChange={e => setFilter(e.target.value)}/></label>{['archive_entries','job_openings'].includes(section) && <button className="mb-5 bg-[#eb2327] px-5 py-3 font-bold text-white" onClick={() => setEditing(section === 'archive_entries' ? {name:'',description:'',image:'',visible:true,display_order:0} : {title:'',location:'Milford, NH',employment_type:'',description:'',is_active:true,display_order:0})}>Add {section === 'archive_entries' ? 'flavor' : 'job'}</button>}<div className="grid gap-3">{rows.filter(row => JSON.stringify(row).toLowerCase().includes(filter.toLowerCase())).sort((a,b) => String(a.page || a.name || a.title || a.created_at).localeCompare(String(b.page || b.name || b.title || b.created_at))).map(row => <button key={String(row.id)} onClick={() => setEditing(row)} className="rounded-xl bg-white p-5 text-left"><strong>{String(row.page || row.name || row.title || row.applicant_name)}</strong><p className="mt-1 text-sm">{String(row.label || row.description || row.role || row.event_date || '').slice(0,140)}</p></button>)}</div></> : <form onSubmit={save} className="grid gap-4 rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">{titles[section]}</h2>{sections[section].map(field => <label key={field} className="font-bold">{field.replaceAll('_',' ')}{typeof editing[field] === 'boolean' ? <input type="checkbox" className="ml-4" checked={Boolean(editing[field])} onChange={e => setEditing({...editing,[field]:e.target.checked})}/> : <textarea readOnly={(section === 'catering_requests' && field !== 'status') || section === 'job_applications' || (section === 'site_content' && field !== 'value')} rows={['description','value','experience','details'].includes(field) ? 5 : 1} required={['name','title'].includes(field)} value={String(editing[field] ?? '')} onChange={e => setEditing({...editing,[field]:field === 'display_order' ? Number(e.target.value) : e.target.value})} className="mt-2 block w-full border p-3 font-normal"/>}</label>)}{(section === 'archive_entries' || (section === 'site_content' && String(editing.id).startsWith('image-'))) && <label>Upload photo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => {if(e.target.files?.[0]) void upload(e.target.files[0]);}} className="block py-3"/></label>}<div className="flex gap-4">{section !== 'job_applications' && <button disabled={busy} className="bg-[#eb2327] px-6 py-3 font-bold text-white">{busy ? 'Saving…' : 'Save changes'}</button>}<button type="button" disabled={busy} onClick={() => setEditing(null)}>Back</button></div></form>}
    </>}
    </>}
  </div></main>;
}
