import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/whatsapp';

interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  selectedAdditions: {
    id: string;
    name: string;
    price: number;
  }[];
  observations?: string;
}

interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string;
  reference_point: string | null;
  payment_method: string;
  payment_details: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_value: number;
  discount_code: string | null;
  total: number;
  status: string;
  observations: string | null;
  items: OrderItem[];
  created_at: string;
  delivery_type?: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
}

interface OrderPrintViewProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentName: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  'card-credit': 'Cartão Crédito',
  'card-debit': 'Cartão Débito',
};

export function OrderPrintView({ order, open, onOpenChange, establishmentName }: OrderPrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '', 'width=300,height=600');
    if (!printWindow) return;

    const orderDate = order ? new Date(order.created_at) : new Date();
    const formattedDate = orderDate.toLocaleDateString('pt-BR');
    const formattedTime = orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido #${order?.id.slice(-6).toUpperCase()}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              padding: 5mm;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header h1 {
              font-size: 16px;
              margin-bottom: 5px;
            }
            .header .order-number {
              font-size: 18px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #000;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .item {
              margin-bottom: 8px;
            }
            .item-name {
              font-weight: bold;
            }
            .item-additions {
              padding-left: 10px;
              font-size: 11px;
            }
            .item-obs {
              padding-left: 10px;
              font-style: italic;
              font-size: 11px;
            }
            .totals {
              margin-top: 10px;
            }
            .totals .row {
              display: flex;
              justify-content: space-between;
            }
            .totals .total {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 11px;
            }
            .scheduled {
              background: #f0f0f0;
              padding: 5px;
              text-align: center;
              font-weight: bold;
              margin-bottom: 10px;
            }
            @media print {
              body { width: 80mm; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!order) return null;

  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('pt-BR');
  const formattedTime = orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Imprimir Pedido
          </DialogTitle>
        </DialogHeader>

        {/* Print Preview */}
        <div 
          ref={printRef}
          className="bg-white text-black p-4 border rounded-lg text-xs font-mono max-h-96 overflow-y-auto"
        >
          <div className="header">
            <h1>{establishmentName}</h1>
            <p>{formattedDate} - {formattedTime}</p>
            <p className="order-number">#{order.id.slice(-6).toUpperCase()}</p>
          </div>

          {order.scheduled_date && order.scheduled_time && (
            <div className="scheduled">
              ⏰ AGENDADO: {new Date(order.scheduled_date).toLocaleDateString('pt-BR')} às {order.scheduled_time}
            </div>
          )}

          <div className="section">
            <p className="section-title">CLIENTE</p>
            <p>{order.customer_name || 'Não informado'}</p>
            <p>{order.customer_phone || ''}</p>
          </div>

          {order.delivery_type !== 'pickup' && (
            <div className="section">
              <p className="section-title">ENTREGA</p>
              <p>{order.customer_address}</p>
              {order.reference_point && <p>Ref: {order.reference_point}</p>}
            </div>
          )}

          {order.delivery_type === 'pickup' && (
            <div className="section">
              <p className="section-title">RETIRADA NO LOCAL</p>
            </div>
          )}

          <div className="section">
            <p className="section-title">ITENS</p>
            {order.items.map((item, index) => (
              <div key={index} className="item">
                <p className="item-name">{item.quantity}x {item.product.name}</p>
                {item.selectedAdditions.length > 0 && (
                  <div className="item-additions">
                    {item.selectedAdditions.map((add, i) => (
                      <p key={i}>+ {add.name} ({formatCurrency(add.price)})</p>
                    ))}
                  </div>
                )}
                {item.observations && (
                  <p className="item-obs">Obs: {item.observations}</p>
                )}
              </div>
            ))}
          </div>

          <div className="section">
            <p className="section-title">PAGAMENTO</p>
            <p>{PAYMENT_LABELS[order.payment_method] || order.payment_method}</p>
            {order.payment_details && <p>{order.payment_details}</p>}
          </div>

          <div className="totals">
            <div className="row">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="row">
                <span>Entrega:</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            {order.discount_value > 0 && (
              <div className="row">
                <span>Desconto:</span>
                <span>-{formatCurrency(order.discount_value)}</span>
              </div>
            )}
            <div className="row total">
              <span>TOTAL:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {order.observations && (
            <div className="section">
              <p className="section-title">OBSERVAÇÕES</p>
              <p>{order.observations}</p>
            </div>
          )}

          <div className="footer">
            <p>Obrigado pela preferência!</p>
          </div>
        </div>

        <Button onClick={handlePrint} className="w-full">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
