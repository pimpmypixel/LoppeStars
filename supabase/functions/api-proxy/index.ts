import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Centralized API proxy Edge Function for Loppestars FastAPI
// Proxies all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
// 
// Edge Function URL: https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy
// Direct API URL:    https://loppestars.spoons.dk
//
// Supported FastAPI endpoints:
// - GET  /                      - Root endpoint
// - GET  /health                - Health check
// - POST /process               - Process images with face anonymization
// - GET  /markets/today         - Get today's markets
// - GET  /markets/nearby        - Get nearby markets with geolocation
// - POST /scraper/trigger       - Manually trigger market scraper

// Backend API base URL (configurable via environment variable)
const API_BASE_URL = Deno.env.get('API_BASE_URL') || 'https://loppestars.spoons.dk';

serve(async (req: Request) => {
  // Handle CORS preflight for all methods
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Extract path from query parameter (e.g., ?path=markets/today)
    const apiPath = url.searchParams.get('path');
    if (!apiPath) {
      return new Response(JSON.stringify({ 
        error: 'Missing path parameter',
        usage: 'Add ?path=<endpoint> to proxy to FastAPI',
        backend: API_BASE_URL,
        examples: [
          {
            description: 'Health check via proxy',
            url: 'https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=health'
          },
          {
            description: 'Health check direct',
            url: 'https://loppestars.spoons.dk/health'
          },
          {
            description: 'Today\'s markets via proxy',
            url: 'https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=markets/today'
          },
          {
            description: 'Nearby markets via proxy',
            url: 'https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=markets/nearby&latitude=55.6761&longitude=12.5683'
          },
          {
            description: 'Process image (POST) via proxy',
            url: 'https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=process',
            method: 'POST',
            body: '{"imagePath": "user/photo.jpg", "userId": "user123", "mode": "pixelate"}'
          }
        ]
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construct target URL and preserve query parameters
    const targetUrl = new URL(`${API_BASE_URL}/${apiPath}`);
    
    // Forward all query parameters except 'path'
    url.searchParams.forEach((value, key) => {
      if (key !== 'path') {
        targetUrl.searchParams.set(key, value);
      }
    });

    console.log('Proxying request:', {
      method: req.method,
      path: apiPath,
      backend: API_BASE_URL,
      targetUrl: targetUrl.toString(),
      hasBody: req.body !== null
    });

    // Prepare headers for forwarding (exclude host and add CORS)
    const forwardHeaders = new Headers();
    
    // Copy all request headers except host
    for (const [key, value] of req.headers) {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'host' && lowerKey !== 'connection') {
        forwardHeaders.set(key, value);
      }
    }

    // Ensure Content-Type is set for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (!forwardHeaders.has('Content-Type')) {
        forwardHeaders.set('Content-Type', 'application/json');
      }
    }

    // Handle request body for all methods that support it
    let body: string | ArrayBuffer | undefined;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.body) {
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        body = await req.text();
      } else if (contentType.includes('multipart/form-data') || contentType.includes('application/octet-stream')) {
        body = await req.arrayBuffer();
      } else {
        body = await req.text();
      }
    }

    // Forward request to FastAPI backend
    const res = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    // Prepare response headers with CORS
    const respHeaders = new Headers(corsHeaders);
    
    // Forward important response headers
    const headersToForward = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified'
    ];
    
    headersToForward.forEach(header => {
      const value = res.headers.get(header);
      if (value) {
        respHeaders.set(header, value);
      }
    });

    // Get response body
    const data = await res.arrayBuffer();

    console.log('Response:', {
      status: res.status,
      contentType: res.headers.get('content-type'),
      size: data.byteLength
    });

    return new Response(data, {
      status: res.status,
      statusText: res.statusText,
      headers: respHeaders,
    });

  } catch (err) {
    console.error('API proxy error:', err);
    
    // Return detailed error for debugging
    return new Response(JSON.stringify({ 
      error: 'Internal proxy error',
      message: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});