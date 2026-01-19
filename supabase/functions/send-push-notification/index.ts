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

// Helper: Base64 URL encoding
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper: Base64 URL decoding
function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper: Concatenar Uint8Arrays
function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Helper: Converter Uint8Array para ArrayBuffer
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(arr.length);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

// Gerar JWT para autenticação VAPID usando JWK
async function generateVapidJwt(endpoint: string, vapidPrivateKeyBase64: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 horas

  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: 'mailto:suporte@pedy.app',
  };

  const headerEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;

  // Decode private key and convert to base64url for JWK
  const privateKeyBytes = base64UrlDecode(vapidPrivateKeyBase64);
  // Ensure we only use the first 32 bytes (raw private key)
  const rawPrivateKey = privateKeyBytes.length > 32 ? privateKeyBytes.slice(0, 32) : privateKeyBytes;
  const privateKeyB64 = base64UrlEncode(rawPrivateKey);
  
  console.log('[Push] Importing private key via JWK, raw key length:', rawPrivateKey.length);
  
  // Import private key using JWK format (much simpler and more compatible)
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: privateKeyB64,
      // x and y are required for JWK but we can derive them or use placeholders
      // For signing, we only need d (private key scalar)
      x: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Placeholder - not used for signing
      y: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Placeholder - not used for signing
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  console.log('[Push] Private key imported successfully');

  // Assinar o token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Converter assinatura DER para raw format (64 bytes)
  const signatureRaw = derToRaw(new Uint8Array(signature));
  const signatureEncoded = base64UrlEncode(signatureRaw);

  console.log('[Push] JWT signed successfully');

  return `${unsignedToken}.${signatureEncoded}`;
}

// Converter assinatura DER para formato raw
function derToRaw(signature: Uint8Array): Uint8Array {
  // Se já está em formato raw (64 bytes), retorna direto
  if (signature.length === 64) {
    return signature;
  }
  
  // Parse DER format
  const raw = new Uint8Array(64);
  
  let offset = 2; // Skip 0x30 and length byte
  
  // Parse R
  if (signature[offset] !== 0x02) throw new Error('Invalid signature format');
  offset++;
  let rLen = signature[offset++];
  let rStart = offset;
  if (signature[rStart] === 0x00) {
    rStart++;
    rLen--;
  }
  raw.set(signature.slice(rStart, rStart + Math.min(rLen, 32)), 32 - Math.min(rLen, 32));
  offset = rStart + rLen + (signature[rStart - 1] === 0x00 ? 0 : 0);
  
  // Skip to S
  offset = 2 + 2 + signature[3];
  if (signature[offset] !== 0x02) throw new Error('Invalid signature format');
  offset++;
  let sLen = signature[offset++];
  let sStart = offset;
  if (signature[sStart] === 0x00) {
    sStart++;
    sLen--;
  }
  raw.set(signature.slice(sStart, sStart + Math.min(sLen, 32)), 64 - Math.min(sLen, 32));
  
  return raw;
}

// Criptografar payload usando ECDH e AES-GCM (Web Push Encryption)
async function encryptPayload(
  payload: string,
  p256dhBase64: string,
  authBase64: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);
  
  // Decodificar chaves do cliente
  const clientPublicKeyBytes = base64UrlDecode(p256dhBase64);
  const authSecret = base64UrlDecode(authBase64);
  
  // Gerar par de chaves efêmeras
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  // Exportar chave pública local
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);
  
  // Importar chave pública do cliente
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(clientPublicKeyBytes),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  // Derivar segredo compartilhado via ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);
  
  // Gerar salt aleatório
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derivar IKM (Input Keying Material)
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prkAuth = await hkdfExtract(authSecret, sharedSecret);
  const ikm = await hkdfExpand(prkAuth, authInfo, 32);
  
  // Derivar chave de criptografia e nonce
  const keyInfo = createInfo('aesgcm', clientPublicKeyBytes, localPublicKey);
  const nonceInfo = createInfo('nonce', clientPublicKeyBytes, localPublicKey);
  
  const prk = await hkdfExtract(salt, ikm);
  const contentEncryptionKey = await hkdfExpand(prk, keyInfo, 16);
  const nonce = await hkdfExpand(prk, nonceInfo, 12);
  
  // Importar chave AES
  const aesKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(contentEncryptionKey),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Adicionar padding (2 bytes de length + payload)
  const paddingLength = 0;
  const paddedPayload = new Uint8Array(2 + paddingLength + payloadBytes.length);
  paddedPayload[0] = (paddingLength >> 8) & 0xff;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, 2 + paddingLength);
  
  // Criptografar
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(nonce) },
    aesKey,
    toArrayBuffer(paddedPayload)
  );
  
  return {
    encrypted: new Uint8Array(encrypted),
    salt,
    localPublicKey,
  };
}

// HKDF Extract
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(salt.length > 0 ? salt : new Uint8Array(32)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const prk = await crypto.subtle.sign('HMAC', key, toArrayBuffer(ikm));
  return new Uint8Array(prk);
}

// HKDF Expand
async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(prk),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info);
  infoWithCounter[info.length] = 1;
  
  const okm = await crypto.subtle.sign('HMAC', key, toArrayBuffer(infoWithCounter));
  return new Uint8Array(okm).slice(0, length);
}

// Criar info para HKDF
function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(`Content-Encoding: ${type}\0P-256\0`);
  const clientLen = new Uint8Array([0, 65]);
  const serverLen = new Uint8Array([0, 65]);
  
  return concatUint8Arrays(
    typeBytes,
    clientLen,
    clientPublicKey,
    serverLen,
    serverPublicKey
  );
}

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
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('Encrypting payload...');

    // Criptografar payload
    const { encrypted, salt, localPublicKey } = await encryptPayload(
      notificationPayload,
      subscription.p256dh,
      subscription.auth
    );

    console.log('Generating VAPID JWT...');

    // Gerar JWT VAPID
    let vapidJwt: string;
    try {
      vapidJwt = await generateVapidJwt(subscription.endpoint, vapidPrivateKey);
    } catch (jwtError) {
      console.error('Error generating VAPID JWT:', jwtError);
      // Fallback: tentar envio sem VAPID completo
      console.log('Attempting fallback without full VAPID...');
      
      const fallbackResponse = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'TTL': '86400',
          'Encryption': `salt=${base64UrlEncode(salt)}`,
          'Crypto-Key': `dh=${base64UrlEncode(localPublicKey)}`,
        },
        body: toArrayBuffer(encrypted),
      });
      
      if (fallbackResponse.ok) {
        console.log('Push notification sent via fallback');
        return new Response(
          JSON.stringify({ success: true, message: 'Notification sent (fallback)' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw jwtError;
    }

    console.log('Sending push notification...');

    // Enviar push notification com VAPID completo
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Encryption': `salt=${base64UrlEncode(salt)}`,
        'Crypto-Key': `dh=${base64UrlEncode(localPublicKey)}`,
      },
      body: toArrayBuffer(encrypted),
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
