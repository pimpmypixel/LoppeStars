import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  emails?: string[];
  summary: Record<string, unknown>;
  status?: 'success' | 'error';
  scrapeDate?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { emails = [], summary, status = 'success', scrapeDate } = body;

    // Validate input
    if (!summary) {
      return new Response(JSON.stringify({ error: 'Summary is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log scrape status to database
    const logEntry = {
      emails,
      summary,
      status,
      scrape_date: scrapeDate || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('scrape_status_logs')
      .insert([logEntry])
      .select();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Scrape status logged:', {
      id: data?.[0]?.id,
      status,
      summaryKeys: Object.keys(summary),
      emailCount: emails.length
    });

    // TODO: Implement email notification if needed
    // For now, just log to database
    
    return new Response(JSON.stringify({ 
      success: true,
      logged: true,
      id: data?.[0]?.id,
      message: 'Scrape status logged successfully'
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