import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Gerar JWT para autenticação VAPID
async function generateVapidJwt(endpoint: string, vapidPrivateKeyBase64: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: 'mailto:suporte@pedy.app',
  };

  const headerEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;

  const privateKeyBytes = base64UrlDecode(vapidPrivateKeyBase64);
  const pkcs8Key = createPkcs8FromRaw(privateKeyBytes);
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    toArrayBuffer(pkcs8Key),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureRaw = derToRaw(new Uint8Array(signature));
  const signatureEncoded = base64UrlEncode(signatureRaw);

  return `${unsignedToken}.${signatureEncoded}`;
}

// Converter chave privada raw para formato PKCS8
function createPkcs8FromRaw(rawKey: Uint8Array): Uint8Array {
  if (rawKey[0] === 0x30 && rawKey.length > 32) {
    return rawKey;
  }
  
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20
  ]);
  
  let keyBytes = rawKey;
  if (rawKey.length > 32) {
    keyBytes = rawKey.slice(0, 32);
  }
  
  const pkcs8Footer = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00, 0x04
  ]);
  
  const publicKeyPlaceholder = new Uint8Array(64).fill(0);
  
  return concatUint8Arrays(pkcs8Header, keyBytes, pkcs8Footer, publicKeyPlaceholder);
}

// Converter assinatura DER para formato raw
function derToRaw(signature: Uint8Array): Uint8Array {
  if (signature.length === 64) {
    return signature;
  }
  
  const raw = new Uint8Array(64);
  let offset = 2;
  
  if (signature[offset] !== 0x02) throw new Error('Invalid signature format');
  offset++;
  let rLen = signature[offset++];
  let rStart = offset;
  if (signature[rStart] === 0x00) {
    rStart++;
    rLen--;
  }
  raw.set(signature.slice(rStart, rStart + Math.min(rLen, 32)), 32 - Math.min(rLen, 32));
  
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
  
  const clientPublicKeyBytes = base64UrlDecode(p256dhBase64);
  const authSecret = base64UrlDecode(authBase64);
  
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);
  
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(clientPublicKeyBytes),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prkAuth = await hkdfExtract(authSecret, sharedSecret);
  const ikm = await hkdfExpand(prkAuth, authInfo, 32);
  
  const keyInfo = createInfo('aesgcm', clientPublicKeyBytes, localPublicKey);
  const nonceInfo = createInfo('nonce', clientPublicKeyBytes, localPublicKey);
  
  const prk = await hkdfExtract(salt, ikm);
  const contentEncryptionKey = await hkdfExpand(prk, keyInfo, 16);
  const nonce = await hkdfExpand(prk, nonceInfo, 12);
  
  const aesKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(contentEncryptionKey),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const paddingLength = 0;
  const paddedPayload = new Uint8Array(2 + paddingLength + payloadBytes.length);
  paddedPayload[0] = (paddingLength >> 8) & 0xff;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, 2 + paddingLength);
  
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
    const { order_id, establishment_id, customer_name, total } = await req.json();

    console.log('Sending store push notification for order:', order_id);

    if (!establishment_id) {
      throw new Error('establishment_id is required');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all store subscriptions for this establishment
    const { data: subscriptions, error: subError } = await supabase
      .from('store_push_subscriptions')
      .select('*')
      .eq('establishment_id', establishment_id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No store push subscriptions found for establishment:', establishment_id);
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} store subscription(s)`);

    // VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    // Format total if provided
    const formattedTotal = total ? `R$ ${Number(total).toFixed(2).replace('.', ',')}` : '';
    
    // Create notification payload
    const notificationPayload = JSON.stringify({
      title: '🔔 Novo Pedido!',
      body: customer_name 
        ? `${customer_name}${formattedTotal ? ` - ${formattedTotal}` : ''}`
        : 'Um novo pedido foi recebido!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `new-order-${order_id}`,
      data: {
        orderId: order_id,
        url: '/dashboard?tab=pedidos',
        type: 'new_order',
      },
      actions: [
        { action: 'view', title: 'Ver Pedido' },
        { action: 'dismiss', title: 'Dispensar' }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
    });

    const results: { success: boolean; endpoint?: string; error?: string }[] = [];

    // Send to all subscriptions
    for (const subscription of subscriptions) {
      try {
        const { endpoint, p256dh, auth } = subscription;

        // Encrypt payload
        const { encrypted, salt, localPublicKey } = await encryptPayload(
          notificationPayload,
          p256dh,
          auth
        );

        // Generate VAPID JWT
        const vapidJwt = await generateVapidJwt(endpoint, vapidPrivateKey);

        // Send push notification
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'Encryption': `salt=${base64UrlEncode(salt)}`,
            'Crypto-Key': `dh=${base64UrlEncode(localPublicKey)};p256ecdsa=${vapidPublicKey}`,
            'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
            'TTL': '86400',
            'Urgency': 'high',
          },
          body: toArrayBuffer(encrypted),
        });

        if (response.status === 201 || response.status === 200) {
          console.log('Push notification sent successfully to:', endpoint.substring(0, 50));
          results.push({ success: true, endpoint: endpoint.substring(0, 50) });
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired, remove it
          console.log('Subscription expired, removing:', subscription.id);
          await supabase
            .from('store_push_subscriptions')
            .delete()
            .eq('id', subscription.id);
          results.push({ success: false, endpoint: endpoint.substring(0, 50), error: 'expired' });
        } else {
          const errorText = await response.text();
          console.error('Push failed:', response.status, errorText);
          results.push({ success: false, endpoint: endpoint.substring(0, 50), error: errorText });
        }
      } catch (error) {
        console.error('Error sending to subscription:', error);
        results.push({ success: false, error: String(error) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-store-push-notification:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
