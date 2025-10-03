// Base API functions for Loppestars backend using fetch
import Config from 'react-native-config';

const baseURL = Config.API_BASE_URL ?? 'https://loppestars.spoons.dk';

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${baseURL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function processImage(payload: { imagePath: string; userId: string; blurStrength: number }): Promise<{ processedImageUrl: string }> {
  // Include required token query param for Edge Function
  // Include required token query param for Edge Function
  const rawToken = Config.SUPABASE_FUNCTIONS_TOKEN ?? Config.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawToken) {
    throw new Error('Missing Supabase Edge Function token');
  }
  const token = String(rawToken);
  const url = `${baseURL}/process?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Process image failed: ${res.status}`);
  return res.json();
}

export async function getMarketsToday(): Promise<any[]> {
  const res = await fetch(`${baseURL}/markets/today`);
  if (!res.ok) throw new Error(`Markets fetch failed: ${res.status}`);
  return res.json();
}
