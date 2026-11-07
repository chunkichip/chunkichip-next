import type { Metadata } from 'next';
import CurbsideCheckin from './CurbsideCheckin';
export const metadata: Metadata = { title: 'Curbside Check-in | Chunki Chip', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <CurbsideCheckin/>; }
