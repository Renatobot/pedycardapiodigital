import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/whatsapp';
import { useCustomerOrders, CustomerOrder } from '@/hooks/useCustomerOrders';
import { useOrderReviews } from '@/hooks/useOrderReviews';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Package, Loader2, Calendar, MapPin, CreditCard, Star, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderReviewModal from './OrderReviewModal';
import StarRating from './StarRating';
import { useToast } from '@/hooks/use-toast';

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
  const { checkOrderReviewed } = useOrderReviews();
  const { toast } = useToast();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [localOrders, setLocalOrders] = useState<CustomerOrder[]>([]);

  // Sync orders from hook to local state
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  useEffect(() => {
    if (open && customerId && establishmentId) {
      fetchOrders();
    }
  }, [open, customerId, establishmentId, fetchOrders]);

  // Check which orders are already reviewed
  useEffect(() => {
    const checkReviews = async () => {
      if (!localOrders.length) return;
      
      const reviewed = new Set<string>();
      for (const order of localOrders) {
        if (order.status === 'completed') {
          const isReviewed = await checkOrderReviewed(order.id);
          if (isReviewed) {
            reviewed.add(order.id);
          }
        }
      }
      setReviewedOrders(reviewed);
    };

    checkReviews();
  }, [localOrders, checkOrderReviewed]);

  // Realtime subscription for order status updates
  useEffect(() => {
    if (!open || !customerId || !establishmentId) return;

    const channel = supabase
      .channel('customer-order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as any;
          
          // Update local orders with the new status and rejection reason
          setLocalOrders(prev => prev.map(order => 
            order.id === updatedOrder.id 
              ? { 
                  ...order, 
                  status: updatedOrder.status || order.status,
                  rejection_reason: updatedOrder.rejection_reason || null
                }
              : order
          ));

          // Show toast notification for status change
          const statusInfo = getStatusLabel(updatedOrder.status);
          
          // Special toast for rejection with reason
          if (updatedOrder.status === 'rejected' && updatedOrder.rejection_reason) {
            toast({
              title: '❌ Pedido Rejeitado',
              description: updatedOrder.rejection_reason,
              variant: 'destructive',
            });
          } else {
            toast({
              title: getStatusIcon(updatedOrder.status) + ' Status atualizado!',
              description: `Seu pedido está: ${statusInfo.label}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, customerId, establishmentId, getStatusLabel, toast]);

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      pending: '📦',
      confirmed: '✅',
      preparing: '👨‍🍳',
      delivering: '🛵',
      'on-the-way': '🛵',
      completed: '🎉',
      delivered: '🎉',
      rejected: '❌',
      cancelled: '❌',
    };
    return icons[status] || '📦';
  };

  const handleRepeatOrder = async (order: CustomerOrder) => {
    const success = await repeatOrder(order);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleOpenReview = (orderId: string) => {
    setSelectedOrderId(orderId);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    if (selectedOrderId) {
      setReviewedOrders(prev => new Set(prev).add(selectedOrderId));
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
    <>
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
            ) : localOrders.length === 0 ? (
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
                {localOrders.map((order) => {
                  const statusInfo = getStatusLabel(order.status);
                  const isDelivered = order.status === 'completed' || order.status === 'delivered';
                  const isRejected = order.status === 'rejected';
                  const isReviewed = reviewedOrders.has(order.id);
                  
                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {formatOrderDate(order.created_at)}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${statusInfo.color} flex items-center gap-1`}
                          >
                            <span>{getStatusIcon(order.status)}</span>
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

                        {/* Rejection reason */}
                        {isRejected && (order as any).rejection_reason && (
                          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-md p-2 border border-red-200">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Motivo da rejeição:</p>
                              <p>{(order as any).rejection_reason}</p>
                            </div>
                          </div>
                        )}

                        {/* Review badge if already reviewed */}
                        {isReviewed && (
                          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-md p-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Você já avaliou este pedido</span>
                          </div>
                        )}

                        {/* Total and actions */}
                        <div className="flex items-center justify-between border-t pt-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Review button - only for delivered orders */}
                            {isDelivered && !isReviewed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReview(order.id)}
                                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Avaliar
                              </Button>
                            )}

                            <Button
                              size="sm"
                              onClick={() => handleRepeatOrder(order)}
                              disabled={order.status === 'cancelled'}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Repetir
                            </Button>
                          </div>
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

      {/* Review Modal */}
      {selectedOrderId && establishmentId && (
        <OrderReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          orderId={selectedOrderId}
          establishmentId={establishmentId}
          customerId={customerId}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}
