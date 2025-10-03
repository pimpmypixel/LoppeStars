import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Centralized API proxy Edge Function
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const apiPath = url.searchParams.get('path');
    if (!apiPath) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const targetUrl = `https://loppestars.spoons.dk/${apiPath}`;
    console.log('Proxying request to:', targetUrl);

  const forwardHeaders = new Headers(corsHeaders);
    for (const [key, value] of req.headers) {
      if (key.toLowerCase() !== 'host') {
        forwardHeaders.set(key, value);
      }
    }

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text();
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const respHeaders = new Headers(corsHeaders);
    res.headers.forEach((value, key) => respHeaders.set(key, value));
    const data = await res.arrayBuffer();

    return new Response(data, {
      status: res.status,
      headers: respHeaders,
    });
  } catch (err) {
    console.error('API proxy error:', err);
    return new Response(JSON.stringify({ error: 'Internal proxy error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});