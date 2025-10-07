import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // For internal calls from Supabase (cron jobs, manual triggers), skip auth check
  const authHeader = req.headers.get('authorization')
  const userAgent = req.headers.get('user-agent')
  
  // Check if this is using the anon key (which we allow for operational triggers)
  const isAnonKey = authHeader?.includes('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI')
  const isInternalCall = !authHeader || 
                         userAgent?.includes('PostgREST') ||
                         isAnonKey
  
  console.log('Request from:', userAgent, 'Auth:', !!authHeader, 'AnonKey:', isAnonKey, 'Internal:', isInternalCall)

  // If not internal call and not using anon key, verify admin access
  if (!isInternalCall && authHeader && !isAnonKey) {
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      })

      // Extract JWT token and verify admin status
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      
      if (userError || !user) {
        console.error('Authentication failed:', userError?.message)
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('user_is_admin', { user_id: user.id })
      
      if (adminError || !isAdmin) {
        console.error('Admin check failed:', adminError?.message, 'IsAdmin:', isAdmin)
        return new Response(
          JSON.stringify({ success: false, error: 'Admin access required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      console.log('Admin access verified for user:', user.email)
    } catch (authError) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
  }

  try {
    // Get the API endpoint from environment variables
    const API_BASE_URL = Deno.env.get('API_BASE_URL') || 'https://your-ecs-endpoint.com'
    
    console.log(`Triggering scraper at ${API_BASE_URL}/scraper/trigger`)
    
    // Trigger the scraper
    const response = await fetch(`${API_BASE_URL}/scraper/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    
    // Log the result
    console.log('Scraper response:', result)

    if (response.ok) {
      console.log('Scraper triggered successfully')
      
      // Trigger the status notification function
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Trigger send-scrape-status function
        const statusResponse = await supabase.functions.invoke('send-scrape-status', {
          body: {
            success: true,
            message: result.message || 'Scraper completed successfully',
            timestamp: new Date().toISOString(),
            output: result.output
          }
        })

        console.log('Status notification sent:', statusResponse)
      } catch (statusError) {
        console.error('Failed to send status notification:', statusError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Scraper triggered successfully',
          scraperResponse: result
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      throw new Error(`Scraper failed: ${result.message || 'Unknown error'}`)
    }

  } catch (error) {
    console.error('Error triggering scraper:', error)
    
    // Send failure status
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      await supabase.functions.invoke('send-scrape-status', {
        body: {
          success: false,
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.toString() : String(error)
        }
      })
    } catch (statusError) {
      console.error('Failed to send error status notification:', statusError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})