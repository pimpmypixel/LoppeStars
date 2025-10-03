/**
 * Test for send-scrape-status Edge Function via API proxy
 */

describe('Send Scrape Status Email', () => {
  it('should proxy to send-scrape-status and return success', async () => {
    const base = process.env.API_BASE_URL || 'https://loppestars.spoons.dk';
    const token = process.env.SUPABASE_FUNCTIONS_TOKEN || '';

    const res = await fetch(
      `${base}/functions/v1/send-scrape-status?path=functions%2Fsend-scrape-status&token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: ['test@example.com'],
          summary: { markets: 1, timestamp: Date.now() }
        })
      }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});