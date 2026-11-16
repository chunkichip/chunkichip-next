import type { Metadata } from 'next';
import Dashboard from './Dashboard';
export const metadata: Metadata = { title: process.env.NEXT_PUBLIC_OPERATIONS_APP === 'true' ? 'Operations | Chunki Chip' : 'Site Manager | Chunki Chip', robots: { index: false, follow: false } };
export default function AdminPage() { return <Dashboard operations={process.env.NEXT_PUBLIC_OPERATIONS_APP === 'true'} />; }
