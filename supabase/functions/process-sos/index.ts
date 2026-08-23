import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, pickup_location, pickup_address } = await req.json()

    // 1. Validation
    if (!user_id || !pickup_location) {
      throw new Error('Missing required fields: user_id and pickup_location are mandatory.')
    }

    if (typeof pickup_location.lat !== 'number' || typeof pickup_location.lng !== 'number') {
      throw new Error('Invalid pickup_location: lat and lng must be numbers.')
    }

    // 2. Check for existing active bookings to prevent duplicates/spam
    const { data: activeBookings, error: checkError } = await supabaseClient
      .from('bookings')
      .select('id')
      .eq('user_id', user_id)
      .in('status', ['pending', 'active'])
      .limit(1)

    if (checkError) throw checkError
    if (activeBookings && activeBookings.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'You already have an active emergency request.',
          booking_id: activeBookings[0].id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Create the SOS booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        user_id,
        pickup_location,
        pickup_address,
        status: 'pending'
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // 2. Create notification for operators
    const { data: operators, error: opError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('role', 'operator')

    if (!opError && operators) {
      const notifications = operators.map(op => ({
        user_id: op.user_id,
        title: 'URGENT: New SOS Request',
        message: `New SOS request from ${pickup_address || 'Unknown Location'}`,
        type: 'error',
        metadata: { booking_id: booking.id }
      }))

      await supabaseClient.from('notifications').insert(notifications)
    }

    // 3. Log the event
    console.log(`SOS processed for user ${user_id}, booking ID: ${booking.id}`)

    return new Response(
      JSON.stringify({ success: true, booking_id: booking.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
