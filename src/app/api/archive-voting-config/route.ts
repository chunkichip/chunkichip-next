export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return Response.json({ configured: false }, { headers: { 'Cache-Control': 'no-store' } });
  return Response.json({ configured: true, url, publishableKey }, { headers: { 'Cache-Control': 'no-store' } });
}
