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
  observations?: string,
  isScheduledOrder: boolean = false,
  scheduledOrderMessage?: string,
  scheduledDateTime?: { date: string; time: string },
  isRegisteredCustomer: boolean = false,
  customerOrderCount: number = 0
): string {
  const total = subtotal + deliveryFee - discountValue;
  
  let message = `🛒 *NOVO PEDIDO - ${establishmentName}*\n\n`;
  
  // Indicador de cliente cadastrado
  if (isRegisteredCustomer) {
    message += `🟢 *Cliente cadastrado* (${customerOrderCount} ${customerOrderCount === 1 ? 'pedido anterior' : 'pedidos anteriores'})\n\n`;
  } else {
    message += `🔴 *Cliente sem cadastro*\n\n`;
  }
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
    
    // Selected options (customizations)
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      item.selectedOptions.forEach((group) => {
        const optionNames = group.options.map(o => o.name).join(', ');
        const optionPrices = group.options.reduce((sum, o) => sum + o.price, 0);
        message += `   ${group.groupName}: ${optionNames}`;
        if (optionPrices > 0) {
          message += ` (+${formatCurrency(optionPrices)})`;
        }
        message += `\n`;
      });
    }
    
    if (item.selectedAdditions.length > 0) {
      message += `   Adicionais:\n`;
      item.selectedAdditions.forEach((add) => {
        message += `   • ${add.name} (+${formatCurrency(add.price)})\n`;
      });
    }
    
    const additionsTotal = item.selectedAdditions.reduce((a, b) => a + b.price, 0);
    const optionsTotal = (item.selectedOptions || []).reduce((sum, g) => 
      sum + g.options.reduce((oSum, o) => oSum + o.price, 0), 0
    );
    const itemTotal = (item.product.price + additionsTotal + optionsTotal) * item.quantity;
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

  if (isScheduledOrder) {
    message += `\n⏰ *PEDIDO AGENDADO*\n`;
    if (scheduledDateTime) {
      const dateObj = new Date(scheduledDateTime.date);
      const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      message += `📅 *Data:* ${dayName}, ${dateStr}\n`;
      message += `🕐 *Horário:* ${scheduledDateTime.time}\n`;
    }
    if (scheduledOrderMessage) {
      message += `📋 ${scheduledOrderMessage}\n`;
    }
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

// Status notification templates for customer WhatsApp
const STATUS_NOTIFICATION_TEMPLATES: Record<string, (establishmentName: string, orderId: string) => string> = {
  pending: (name, id) => 
    `Olá! 📦 Seu pedido #${id.slice(-6).toUpperCase()} foi *recebido* por ${name} e já estamos preparando tudo com carinho!`,
  
  preparing: (name, id) => 
    `👨‍🍳 Seu pedido #${id.slice(-6).toUpperCase()} de ${name} já está *em preparo*! Em breve sai para entrega!`,
  
  'on-the-way': (name, id) => 
    `🛵 Seu pedido #${id.slice(-6).toUpperCase()} de ${name} *saiu para entrega* e está a caminho!`,
  
  delivered: (name, id) => 
    `✅ Pedido #${id.slice(-6).toUpperCase()} *entregue*! Esperamos que aproveite. Obrigado pela preferência! - ${name}`,
};

export function generateStatusNotificationMessage(
  status: string,
  establishmentName: string,
  orderId: string
): string | null {
  const template = STATUS_NOTIFICATION_TEMPLATES[status];
  return template ? template(establishmentName, orderId) : null;
}

export function generateWhatsAppLinkToCustomer(
  customerPhone: string,
  message: string
): string {
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
