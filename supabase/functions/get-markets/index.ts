import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Market {
  id: string
  external_id: string
  name: string
  municipality?: string
  category: string
  start_date: string
  end_date: string
  address?: string
  city?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  description?: string
  organizer_name?: string
  organizer_phone?: string
  organizer_email?: string
  organizer_website?: string
  opening_hours?: string
  entry_fee?: number
  stall_count?: number
  has_food: boolean
  has_parking: boolean
  has_toilets: boolean
  has_wifi: boolean
  is_indoor: boolean
  is_outdoor: boolean
  special_features?: string
  source_url?: string
  scraped_at: string
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    if (path === 'today') {
      // Get today's markets
      const today = new Date().toISOString().split('T')[0]
      const { latitude, longitude, limit = '50' } = Object.fromEntries(url.searchParams)

      let query = supabaseClient
        .from('markets')
        .select('*')
        .gte('start_date', today)
        .lte('end_date', today)
        .limit(parseInt(limit))

      const { data: markets, error } = await query

      if (error) throw error

      // Calculate distances if coordinates provided
      let marketsWithDistance = markets?.map(market => {
        let distance: number | undefined
        if (latitude && longitude && market.latitude && market.longitude) {
          distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            market.latitude,
            market.longitude
          )
        }
        return { ...market, distance }
      }) || []

      // Sort by distance if coordinates provided, otherwise by start date
      if (latitude && longitude) {
        marketsWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      } else {
        marketsWithDistance.sort((a, b) => a.start_date.localeCompare(b.start_date))
      }

      return new Response(
        JSON.stringify(marketsWithDistance),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )

    } else if (path === 'nearby') {
      // Get nearby markets
      const { latitude, longitude, radius_km = '50', days_ahead = '30', limit = '50' } = Object.fromEntries(url.searchParams)

      if (!latitude || !longitude) {
        return new Response(
          JSON.stringify({ error: 'latitude and longitude are required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      const today = new Date()
      const endDate = new Date()
      endDate.setDate(today.getDate() + parseInt(days_ahead))

      const { data: markets, error } = await supabaseClient
        .from('markets')
        .select('*')
        .gte('start_date', today.toISOString().split('T')[0])
        .lte('start_date', endDate.toISOString().split('T')[0])
        .limit(20) // Get more markets to filter

      if (error) throw error

      // For demo purposes, add some test coordinates to markets that don't have them
      const marketsWithCoords = markets?.map((market, index) => {
        if (!market.latitude || !market.longitude) {
          // Add test coordinates around Copenhagen area
          const testCoords = [
            { lat: 55.6761, lon: 12.5683 }, // Central Copenhagen
            { lat: 55.6830, lon: 12.5700 }, // Near central
            { lat: 55.6700, lon: 12.5800 }, // Another location
            { lat: 55.6900, lon: 12.5600 }, // Different area
            { lat: 55.6650, lon: 12.5900 }, // Further out
          ]
          const coord = testCoords[index % testCoords.length]
          return { ...market, latitude: coord.lat, longitude: coord.lon, is_test_coord: true }
        }
        return market
      }) || []

      // Filter by distance
      const nearbyMarkets = marketsWithCoords.filter(market => {
        if (!market.latitude || !market.longitude) return false
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          market.latitude,
          market.longitude
        )
        return distance <= parseFloat(radius_km)
      }).map(market => ({
        ...market,
        distance: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          market.latitude,
          market.longitude
        )
      })) || []

      // Sort by distance
      nearbyMarkets.sort((a, b) => a.distance - b.distance)

      return new Response(
        JSON.stringify(nearbyMarkets.slice(0, parseInt(limit))),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )

    } else if (path === 'search') {
      // Search markets
      const { query: searchQuery, limit = '20' } = Object.fromEntries(url.searchParams)

      if (!searchQuery) {
        return new Response(
          JSON.stringify({ error: 'query parameter is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      const { data: markets, error } = await supabaseClient
        .from('markets')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,municipality.ilike.%${searchQuery}%`)
        .limit(parseInt(limit))

      if (error) throw error

      return new Response(
        JSON.stringify(markets || []),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})