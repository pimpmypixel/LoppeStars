import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  // Legacy format support
  emails?: string[];
  summary?: Record<string, unknown>;
  status?: 'success' | 'error';
  scrapeDate?: string;
  
  // New format support
  success?: boolean;
  message?: string;
  timestamp?: string;
  output?: string;
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    
    // Support both old and new format
    let success: boolean;
    let message: string;
    let timestamp: string;
    let output: string | undefined;
    let errorDetails: string | undefined;
    
    if (body.success !== undefined) {
      // New format
      success = body.success;
      message = body.message || '';
      timestamp = body.timestamp || new Date().toISOString();
      output = body.output;
      errorDetails = body.error;
    } else {
      // Legacy format
      success = body.status === 'success';
      message = body.summary ? JSON.stringify(body.summary) : 'Scraper executed';
      timestamp = body.scrapeDate || new Date().toISOString();
      output = undefined;
      errorDetails = undefined;
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log to new scraping_logs table
    const { data, error } = await supabase
      .from('scraping_logs')
      .insert({
        success,
        message,
        output,
        error_details: errorDetails,
        scraped_at: timestamp
      })
      .select();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log(`Scraping status logged: ${success ? 'SUCCESS' : 'FAILURE'} - ${message}`);
    
    return new Response(JSON.stringify({ 
      success: true,
      logged: true,
      id: data?.[0]?.id,
      message: 'Scraping status logged successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('send-scrape-status error:', err);
    
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});