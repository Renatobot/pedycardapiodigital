import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORT_WHATSAPP = "5521920078469";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getWhatsAppLink(message: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

function getVerificationEmailHtml(code: string): string {
  const whatsappLink = getWhatsAppLink("Olá! Preciso de ajuda com o cadastro no PEDY.");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 32px; font-weight: bold; color: #4A9BD9; margin: 0;">PEDY</h1>
        <p style="color: #71717a; margin: 8px 0 0 0;">Cardápio Digital</p>
      </div>
      
      <!-- Content -->
      <h2 style="font-size: 24px; color: #18181b; text-align: center; margin: 0 0 16px 0;">
        Confirme seu e-mail
      </h2>
      
      <p style="color: #52525b; text-align: center; margin: 0 0 32px 0; line-height: 1.6;">
        Use o código abaixo para verificar seu e-mail e concluir o cadastro:
      </p>
      
      <!-- Code Box -->
      <div style="background: linear-gradient(135deg, #4A9BD9 0%, #4CAF50 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">
          ${code}
        </span>
      </div>
      
      <p style="color: #71717a; text-align: center; font-size: 14px; margin: 0 0 32px 0;">
        ⏰ Este código expira em <strong>5 minutos</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
      
      <!-- WhatsApp CTA -->
      <p style="color: #52525b; text-align: center; margin: 0 0 16px 0;">
        Precisa de ajuda com o cadastro?
      </p>
      
      <div style="text-align: center;">
        <a href="${whatsappLink}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          💬 Falar no WhatsApp
        </a>
      </div>
      
      <!-- Footer -->
      <div style="margin-top: 40px; text-align: center;">
        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
          Este e-mail foi enviado pelo PEDY - Cardápio Digital
        </p>
        <p style="color: #a1a1aa; font-size: 12px; margin: 8px 0 0 0;">
          Se você não solicitou este código, ignore este e-mail.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "E-mail é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending verification code to: ${email}`);

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing codes for this email
    await supabaseAdmin
      .from("email_verifications")
      .delete()
      .eq("email", email.toLowerCase());

    // Store the code
    const { error: insertError } = await supabaseAdmin
      .from("email_verifications")
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification code:", insertError);
      throw new Error("Erro ao gerar código de verificação");
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "PEDY <onboarding@resend.dev>",
      to: [email],
      subject: "Código de verificação PEDY",
      html: getVerificationEmailHtml(code),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Código enviado com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar código" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
