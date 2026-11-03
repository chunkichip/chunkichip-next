import type { Metadata } from 'next';
import Dashboard from './Dashboard';
export const metadata: Metadata = { title: 'Site Manager | Chunki Chip', robots: { index: false, follow: false } };
export default function AdminPage() { return <Dashboard />; }
