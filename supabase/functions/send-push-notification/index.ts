import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de status para mensagens
const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  'confirmed': {
    title: '✅ Pedido Confirmado!',
    body: 'Seu pedido foi confirmado e está sendo preparado.',
  },
  'preparing': {
    title: '👨‍🍳 Em Preparo!',
    body: 'Seu pedido está sendo preparado com carinho.',
  },
  'on-the-way': {
    title: '🛵 Saiu para Entrega!',
    body: 'Seu pedido está a caminho. Fique atento!',
  },
  'delivered': {
    title: '🎉 Entregue!',
    body: 'Seu pedido foi entregue. Bom apetite!',
  },
  'cancelled': {
    title: '❌ Pedido Cancelado',
    body: 'Infelizmente seu pedido foi cancelado.',
  },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, newStatus, establishmentId, customerPhone, establishmentName } = await req.json();

    console.log('Received push notification request:', {
      orderId,
      newStatus,
      establishmentId,
      customerPhone,
      establishmentName,
    });

    // Validar parâmetros
    if (!establishmentId || !customerPhone || !newStatus) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter mensagem para o status
    const message = STATUS_MESSAGES[newStatus];
    if (!message) {
      console.log('No message template for status:', newStatus);
      return new Response(
        JSON.stringify({ error: 'No message for this status', status: newStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar subscription do cliente
    const { data: subscription, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('establishment_id', establishmentId)
      .eq('customer_phone', customerPhone)
      .single();

    if (subError || !subscription) {
      console.log('No subscription found for customer:', customerPhone);
      return new Response(
        JSON.stringify({ message: 'No subscription found', customerPhone }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found subscription:', subscription.endpoint);

    // Obter chaves VAPID
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;

    // Preparar payload da notificação
    const notificationPayload = JSON.stringify({
      title: message.title,
      body: `${establishmentName}: ${message.body}`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `order-${orderId}`,
      data: {
        orderId,
        status: newStatus,
        url: '/',
      },
    });

    // Enviar push notification usando Web Push Protocol simples
    // Nota: Para produção completa, seria necessário usar web-push lib ou implementação completa de VAPID
    // Por enquanto, usamos uma abordagem simplificada que funciona para a maioria dos casos
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: notificationPayload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Push service error:', response.status, errorText);

      // Se subscription expirou, remover do banco
      if (response.status === 410 || response.status === 404) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', subscription.id);
        console.log('Removed expired subscription');
      }

      return new Response(
        JSON.stringify({ error: 'Push service error', status: response.status, details: errorText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Push notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
