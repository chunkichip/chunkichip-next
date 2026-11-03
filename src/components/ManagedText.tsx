'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { cmsClient } from '@/lib/cms-client';

const Content = createContext<Record<string, string>>({});
export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const client = cmsClient();
    if (!client) return;
    let active = true;
    client.from('site_content').select('id,value').then(({ data }) => {
      if (active && data) setValues(Object.fromEntries(data.map(row => [row.id, row.value])));
    });
    return () => { active = false; };
  }, []);
  return <Content.Provider value={values}>{children}</Content.Provider>;
}
export default function ManagedText({ id, fallback }: { id: string; fallback: string }) {
  const values = useContext(Content);
  return <>{values[id] ?? fallback}</>;
}
export function ManagedImage({ cmsId, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { cmsId: string }) {
  const values = useContext(Content);
  const replacement = values[cmsId];
  const safe = replacement && (replacement.startsWith('/') || replacement.startsWith('https://'));
  return <img {...props} alt={props.alt || ''} src={safe ? replacement : props.src} />;
}
