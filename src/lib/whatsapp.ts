import { CartItem } from '@/types';

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function generateOrderMessage(
  establishmentName: string,
  items: CartItem[],
  customerName: string,
  address: string,
  neighborhood: string,
  referencePoint: string,
  deliveryType: 'delivery' | 'pickup' | 'other',
  paymentMethod: string,
  paymentDetails: string,
  subtotal: number,
  deliveryFee: number = 0,
  discountValue: number = 0,
  discountCode: string | null = null,
  observations?: string
): string {
  const total = subtotal + deliveryFee - discountValue;
  
  let message = `🛒 *NOVO PEDIDO - ${establishmentName}*\n\n`;
  message += `👤 *Cliente:* ${customerName}\n`;
  
  if (deliveryType === 'pickup') {
    message += `📦 *Tipo:* Retirada no local\n\n`;
  } else {
    message += `📍 *Endereço:* ${address}\n`;
    message += `🏘️ *Bairro:* ${neighborhood}\n`;
    if (referencePoint) {
      message += `📌 *Ponto de referência:* ${referencePoint}\n`;
    }
    message += `\n`;
  }
  
  message += `📝 *ITENS DO PEDIDO:*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  
  items.forEach((item, index) => {
    message += `\n${index + 1}. *${item.product.name}*\n`;
    message += `   Qtd: ${item.quantity}x ${formatCurrency(item.product.price)}\n`;
    
    if (item.selectedAdditions.length > 0) {
      message += `   Adicionais:\n`;
      item.selectedAdditions.forEach((add) => {
        message += `   • ${add.name} (+${formatCurrency(add.price)})\n`;
      });
    }
    
    const additionsTotal = item.selectedAdditions.reduce((a, b) => a + b.price, 0);
    const itemTotal = (item.product.price + additionsTotal) * item.quantity;
    message += `   *Subtotal: ${formatCurrency(itemTotal)}*\n`;
    
    if (item.observations) {
      message += `   📝 Obs: ${item.observations}\n`;
    }
  });
  
  message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💳 *Pagamento:* ${paymentMethod}\n`;
  message += paymentDetails ? `${paymentDetails}\n` : '';
  
  message += `\n📦 *Subtotal:* ${formatCurrency(subtotal)}\n`;
  
  if (deliveryFee > 0) {
    message += `🚗 *Taxa de entrega:* ${formatCurrency(deliveryFee)}\n`;
  }
  
  if (discountValue > 0) {
    message += `🎟️ *Desconto${discountCode ? ` (${discountCode})` : ''}:* -${formatCurrency(discountValue)}\n`;
  }
  
  message += `\n💰 *TOTAL: ${formatCurrency(total)}*\n`;
  
  if (observations) {
    message += `\n📝 *Observações gerais:* ${observations}\n`;
  }
  
  message += `\n✅ Pedido realizado via PEDY`;
  
  return message;
}

export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
}

export function generateUpgradeMessage(): string {
  return 'Olá! Quero ativar/renovar o Plano Pro do PEDY por R$ 37,00 por mês para o meu estabelecimento.';
}

export function generatePaymentMessage(
  establishmentName: string,
  isTrialExpired: boolean
): string {
  if (isTrialExpired) {
    return `Olá! Sou do estabelecimento "${establishmentName}" e gostaria de ativar o Plano PRO do PEDY por R$ 37,00/mês.`;
  }
  return `Olá! Sou do estabelecimento "${establishmentName}" e gostaria de renovar meu Plano PRO do PEDY por R$ 37,00.`;
}

export const SUPPORT_WHATSAPP = '21920078469';

export function openPaymentWhatsApp(establishmentName: string, isTrialExpired: boolean): void {
  const message = generatePaymentMessage(establishmentName, isTrialExpired);
  openWhatsApp(SUPPORT_WHATSAPP, message);
}

export function generateWhatsAppLink(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/55${SUPPORT_WHATSAPP}?text=${encodedMessage}`;
}
