import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define available pages and features
const AVAILABLE_PAGES = {
  home: { path: "/", description: "Homepage with emergency services and ambulance booking" },
  sos: { path: "/sos", description: "Emergency SOS page to request immediate ambulance" },
  auth: { path: "/auth", description: "Login and signup page" },
  profile: { path: "/profile", description: "User profile page to manage personal information" },
  bookings: { path: "/bookings", description: "View booking history and past ambulance requests" },
  products: { path: "/products", description: "View our products and services" },
  about: { path: "/about", description: "About us page with company information" },
  doctors: { path: "/doctors", description: "Information for doctors and medical professionals" },
  clients: { path: "/clients", description: "Our clients and partnerships" },
  abha: { path: "/abha", description: "ABHA (Ayushman Bharat Health Account) information" },
  careers: { path: "/careers", description: "Career opportunities and job openings" },
  news: { path: "/news", description: "Latest news and events" },
};

const SYSTEM_PROMPT = `You are an intelligent healthcare assistant for Ambula, an ambulance booking and emergency services platform. You have the ability to help users navigate the platform and perform actions.

CRITICAL: You MUST respond with valid JSON in this exact format:
{
  "message": "Your response message to the user",
  "action": null or { "type": "navigate" | "dispatch_ambulance" | "call_emergency", "payload": {} }
}

AVAILABLE ACTIONS:

1. **Navigation** - When users want to go to a page:
   - type: "navigate"
   - payload: { "path": "/route" }
   
   Available routes:
   - "/" - Homepage
   - "/sos" - Emergency SOS (for urgent ambulance requests)
   - "/auth" - Login/Signup
   - "/profile" - User profile
   - "/bookings" - Booking history
   - "/products" - Products and services
   - "/about" - About us
   - "/doctors" - For doctors
   - "/clients" - Our clients
   - "/abha" - ABHA information
   - "/careers" - Careers
   - "/news" - News and events

2. **Dispatch Ambulance** - For EXTREME emergencies only:
   - type: "dispatch_ambulance"
   - payload: { "emergency_type": "cardiac" | "accident" | "breathing" | "stroke" | "other", "description": "brief description" }
   - ONLY use this when user explicitly describes a life-threatening emergency
   - Always confirm before dispatching

3. **Call Emergency** - Provide emergency hotline:
   - type: "call_emergency"
   - payload: { "number": "108" }

IMPORTANT RULES:
1. For navigation requests like "show me news", "go to careers", "I want to see my bookings" - use navigate action
2. For emergencies like "I need an ambulance NOW", "someone is having a heart attack" - confirm first, then use dispatch_ambulance
3. For general health questions, provide helpful information without actions
4. Be concise but helpful
5. If user says "emergency" or describes urgent medical situation, prioritize getting them help
6. Always ask for confirmation before dispatching an ambulance

EXAMPLES:
User: "Can I read news and events?"
Response: { "message": "Of course! Let me take you to our news and events page.", "action": { "type": "navigate", "payload": { "path": "/news" } } }

User: "Show me my booking history"
Response: { "message": "I'll open your booking history for you.", "action": { "type": "navigate", "payload": { "path": "/bookings" } } }

User: "My father is having chest pain and difficulty breathing"
Response: { "message": "This sounds like a serious emergency. I'm ready to dispatch an ambulance immediately. Please confirm you want me to send an ambulance to your location.", "action": null }

User: "Yes, please send an ambulance"
Response: { "message": "I'm dispatching an ambulance to your location right now. An ambulance is on its way. Please stay calm and keep the patient comfortable. Is there anything else I can help with while you wait?", "action": { "type": "dispatch_ambulance", "payload": { "emergency_type": "cardiac", "description": "Chest pain and difficulty breathing" } } }`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized - No token provided" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.id);

    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
