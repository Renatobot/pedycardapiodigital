import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/whatsapp';
import { useCustomerOrders, CustomerOrder } from '@/hooks/useCustomerOrders';
import { RefreshCw, Package, Loader2, Calendar, MapPin, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerOrderHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  establishmentId?: string;
  establishmentName?: string;
}

export default function CustomerOrderHistory({
  open,
  onOpenChange,
  customerId,
  establishmentId,
  establishmentName,
}: CustomerOrderHistoryProps) {
  const { orders, loading, fetchOrders, repeatOrder, getStatusLabel } = useCustomerOrders(
    customerId,
    establishmentId
  );

  useEffect(() => {
    if (open && customerId && establishmentId) {
      fetchOrders();
    }
  }, [open, customerId, establishmentId, fetchOrders]);

  const handleRepeatOrder = async (order: CustomerOrder) => {
    const success = await repeatOrder(order);
    if (success) {
      onOpenChange(false);
    }
  };

  const formatOrderDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {establishmentName ? `Pedidos em ${establishmentName}` : 'Meus Pedidos'}
          </SheetTitle>
          {establishmentName && (
            <p className="text-xs text-muted-foreground mt-1">
              Exibindo apenas pedidos feitos neste estabelecimento
            </p>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {establishmentName 
                  ? `Você ainda não fez pedidos em ${establishmentName}`
                  : 'Você ainda não fez nenhum pedido'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getStatusLabel(order.status);
                
                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatOrderDate(order.created_at)}
                        </div>
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Items */}
                      <div className="space-y-1 border-t pt-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="truncate flex-1">
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {formatCurrency(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            + {order.items.length - 3} item(s)
                          </p>
                        )}
                      </div>

                      {/* Delivery info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{order.customer_address}</span>
                      </div>

                      {/* Total and action */}
                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleRepeatOrder(order)}
                          disabled={order.status === 'cancelled'}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Repetir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
