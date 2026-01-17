import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORT_WHATSAPP = "5521920078469";
const PLAN_PRICE = "R$ 37,00";

type NotificationType = 
  | "welcome"
  | "trial_expiring"
  | "trial_expired"
  | "plan_activated"
  | "plan_expiring"
  | "plan_renewed";

interface NotificationRequest {
  type: NotificationType;
  email: string;
  establishmentName: string;
  daysRemaining?: number;
}

function getWhatsAppLink(message: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

function getEmailContent(type: NotificationType, establishmentName: string, daysRemaining?: number): { subject: string; html: string } {
  const baseStyles = `
    <style>
      body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .card { background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .logo { text-align: center; margin-bottom: 32px; }
      .logo h1 { font-size: 32px; font-weight: bold; color: #4A9BD9; margin: 0; }
      .logo p { color: #71717a; margin: 8px 0 0 0; }
      .title { font-size: 24px; color: #18181b; text-align: center; margin: 0 0 16px 0; }
      .text { color: #52525b; text-align: center; line-height: 1.6; margin: 0 0 24px 0; }
      .highlight { background: linear-gradient(135deg, #4A9BD9 0%, #4CAF50 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; color: #ffffff; }
      .price { font-size: 28px; font-weight: bold; }
      .cta { text-align: center; margin: 32px 0; }
      .cta a { display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; }
      .divider { border: none; border-top: 1px solid #e4e4e7; margin: 32px 0; }
      .footer { margin-top: 40px; text-align: center; }
      .footer p { color: #a1a1aa; font-size: 12px; margin: 8px 0; }
      .warning { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0; }
      .warning p { color: #92400e; margin: 0; text-align: center; }
      .success { background-color: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 24px 0; }
      .success p { color: #166534; margin: 0; text-align: center; }
    </style>
  `;

  const header = `
    <div class="logo">
      <h1>PEDY</h1>
      <p>Cardápio Digital</p>
    </div>
  `;

  const footer = `
    <div class="footer">
      <p>Este e-mail foi enviado pelo PEDY - Cardápio Digital</p>
      <p>Dúvidas? Fale conosco no WhatsApp!</p>
    </div>
  `;

  let subject = "";
  let content = "";

  switch (type) {
    case "welcome":
      subject = "🎉 Bem-vindo ao PEDY! Seu trial começou";
      const welcomeWhatsApp = getWhatsAppLink(`Olá! Sou do ${establishmentName} e acabei de criar minha conta no PEDY. Gostaria de tirar algumas dúvidas.`);
      content = `
        <h2 class="title">Bem-vindo ao PEDY, ${establishmentName}! 🎉</h2>
        <p class="text">
          Seu período de teste gratuito de <strong>7 dias</strong> já começou!<br>
          Aproveite para configurar seu cardápio digital e começar a receber pedidos.
        </p>
        <div class="success">
          <p>✅ Conta criada com sucesso! Seu trial está ativo.</p>
        </div>
        <p class="text">
          Durante o trial, você tem acesso a todas as funcionalidades do PEDY.
          Após os 7 dias, ative o Plano Pro por apenas <strong>${PLAN_PRICE}/mês</strong>.
        </p>
        <div class="cta">
          <a href="${welcomeWhatsApp}">💬 Preciso de ajuda para começar</a>
        </div>
      `;
      break;

    case "trial_expiring":
      subject = `⏰ Seu trial expira em ${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}!`;
      const trialExpiringWhatsApp = getWhatsAppLink(`Olá! Sou do ${establishmentName} e quero ativar o Plano Pro do PEDY por ${PLAN_PRICE}/mês.`);
      content = `
        <h2 class="title">Seu trial está acabando! ⏰</h2>
        <p class="text">
          ${establishmentName}, seu período de teste gratuito expira em <strong>${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}</strong>.
        </p>
        <div class="warning">
          <p>⚠️ Após o trial, seus clientes não conseguirão fazer pedidos.</p>
        </div>
        <p class="text">
          Continue recebendo pedidos ativando o Plano Pro agora:
        </p>
        <div class="highlight">
          <p class="price">${PLAN_PRICE}/mês</p>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Cardápio ilimitado • Pedidos ilimitados</p>
        </div>
        <div class="cta">
          <a href="${trialExpiringWhatsApp}">💬 Ativar Plano Pro no WhatsApp</a>
        </div>
      `;
      break;

    case "trial_expired":
      subject = "❌ Seu trial expirou - Ative o Plano Pro";
      const trialExpiredWhatsApp = getWhatsAppLink(`Olá! Sou do ${establishmentName} e meu trial expirou. Quero ativar o Plano Pro do PEDY por ${PLAN_PRICE}/mês.`);
      content = `
        <h2 class="title">Seu trial expirou 😢</h2>
        <p class="text">
          ${establishmentName}, seu período de teste gratuito chegou ao fim.
        </p>
        <div class="warning">
          <p>🚫 Seus clientes não conseguem finalizar pedidos no momento.</p>
        </div>
        <p class="text">
          Não perca vendas! Ative o Plano Pro agora e volte a receber pedidos:
        </p>
        <div class="highlight">
          <p class="price">${PLAN_PRICE}/mês</p>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Reative seu cardápio em minutos!</p>
        </div>
        <div class="cta">
          <a href="${trialExpiredWhatsApp}">💬 Ativar Plano Pro Agora</a>
        </div>
      `;
      break;

    case "plan_activated":
      subject = "✅ Plano Pro ativado com sucesso!";
      const activatedWhatsApp = getWhatsAppLink(`Olá! Sou do ${establishmentName} e acabei de ativar o Plano Pro. Obrigado!`);
      content = `
        <h2 class="title">Plano Pro Ativado! 🚀</h2>
        <p class="text">
          Parabéns, ${establishmentName}! Seu Plano Pro está ativo.
        </p>
        <div class="success">
          <p>✅ Você já pode receber pedidos ilimitados!</p>
        </div>
        <p class="text">
          Obrigado por confiar no PEDY para gerenciar seus pedidos.<br>
          Estamos aqui para ajudar no que precisar!
        </p>
        <div class="cta">
          <a href="${activatedWhatsApp}">💬 Falar no WhatsApp</a>
        </div>
      `;
      break;

    case "plan_expiring":
      subject = `⏰ Seu plano expira em ${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}!`;
      const planExpiringWhatsApp = getWhatsAppLink(`Olá! Sou do ${establishmentName} e quero renovar meu Plano Pro do PEDY por ${PLAN_PRICE}.`);
      content = `
        <h2 class="title">Renove seu Plano Pro! ⏰</h2>
        <p class="text">
          ${establishmentName}, seu Plano Pro expira em <strong>${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}</strong>.
        </p>
        <div class="warning">
          <p>⚠️ Após o vencimento, seus clientes não conseguirão fazer pedidos.</p>
        </div>
        <p class="text">
          Renove agora e continue recebendo pedidos sem interrupção:
        </p>
        <div class="highlight">
          <p class="price">${PLAN_PRICE}</p>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Renove por mais 1 mês</p>
        </div>
        <div class="cta">
          <a href="${planExpiringWhatsApp}">💬 Renovar no WhatsApp</a>
        </div>
      `;
      break;

    case "plan_renewed":
      subject = "✅ Plano renovado com sucesso!";
      const renewedWhatsApp = getWhatsAppLink(`Olá! Sou do ${establishmentName} e acabei de renovar meu Plano Pro. Obrigado!`);
      content = `
        <h2 class="title">Plano Renovado! 🎉</h2>
        <p class="text">
          ${establishmentName}, seu Plano Pro foi renovado com sucesso!
        </p>
        <div class="success">
          <p>✅ Seu cardápio continua ativo por mais 1 mês!</p>
        </div>
        <p class="text">
          Obrigado por continuar com o PEDY.<br>
          Boas vendas!
        </p>
        <div class="cta">
          <a href="${renewedWhatsApp}">💬 Falar no WhatsApp</a>
        </div>
      `;
      break;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="card">
      ${header}
      ${content}
      <hr class="divider">
      ${footer}
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, establishmentName, daysRemaining }: NotificationRequest = await req.json();

    if (!type || !email || !establishmentName) {
      return new Response(
        JSON.stringify({ error: "type, email e establishmentName são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending ${type} notification to: ${email} for ${establishmentName}`);

    const { subject, html } = getEmailContent(type, establishmentName, daysRemaining);

    const emailResponse = await resend.emails.send({
      from: "PEDY <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Notification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notificação enviada com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-plan-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar notificação" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
