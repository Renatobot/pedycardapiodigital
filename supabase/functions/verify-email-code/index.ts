import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ valid: false, error: "E-mail e código são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Verifying code for email: ${email}`);

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the verification record
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from("email_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .single();

    if (fetchError || !verification) {
      console.log("Code not found or invalid");
      return new Response(
        JSON.stringify({ valid: false, error: "Código inválido" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if code has expired
    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      console.log("Code has expired");
      // Delete expired code
      await supabaseAdmin
        .from("email_verifications")
        .delete()
        .eq("id", verification.id);

      return new Response(
        JSON.stringify({ valid: false, error: "Código expirado. Solicite um novo código." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark as verified
    await supabaseAdmin
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    console.log("Email verified successfully");

    return new Response(
      JSON.stringify({ valid: true, message: "E-mail verificado com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-email-code:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message || "Erro ao verificar código" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
