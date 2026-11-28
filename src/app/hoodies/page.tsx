import type { Metadata } from 'next';
import HoodieOrder from './HoodieOrder';
export const metadata: Metadata = { title: 'Chunki Chip Hoodies | Milford Pickup', description: 'Shop the black Chunki Chip logo hoodie in XS–3XL. Milford pickup in 1–7 days; we will contact you when it is ready.', alternates: { canonical: 'https://chunkichip.com/hoodies' } };
export default function Page() { return <HoodieOrder/>; }
