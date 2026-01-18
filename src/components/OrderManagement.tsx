import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, MapPin, CreditCard, Package, Truck, CheckCircle, XCircle, Eye, Loader2, MessageCircle, Phone, User, Calendar } from 'lucide-react';
import { formatCurrency, generateStatusNotificationMessage, generateWhatsAppLinkToCustomer } from '@/lib/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pedido recebido', color: 'bg-blue-500', icon: Clock },
  preparing: { label: 'Em preparo', color: 'bg-yellow-500', icon: Package },
  'on-the-way': { label: 'A caminho', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
};

interface OrderManagementProps {
  establishmentId: string;
  establishmentName: string;
  notifyCustomerEnabled: boolean;
}

export function OrderManagement({ establishmentId, establishmentName, notifyCustomerEnabled }: OrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Audio ref for new order notification
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio('/sounds/new-order.mp3');
    audioRef.current.volume = 0.7;
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mappedOrders = (data || []).map((order: any) => ({
        ...order,
        items: order.items as OrderItem[],
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `establishment_id=eq.${establishmentId}`,
        },
        () => {
          // Play notification sound for new orders
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.log('Audio play failed:', err));
          }
          
          // Show toast notification
          toast({
            title: '🔔 Novo Pedido!',
            description: 'Um novo pedido acabou de chegar.',
          });
          
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `establishment_id=eq.${establishmentId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, toast]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Find the order to get customer info
      const updatedOrder = orders.find(o => o.id === orderId);

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast({
        title: 'Status atualizado!',
        description: `Pedido alterado para "${STATUS_LABELS[newStatus]?.label || newStatus}"`,
      });

      // Send push notification to customer
      if (updatedOrder?.customer_phone) {
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              orderId,
              newStatus,
              establishmentId,
              customerPhone: updatedOrder.customer_phone,
              establishmentName,
            },
          });
        } catch (pushError) {
          console.log('Push notification failed (optional):', pushError);
        }
      }

      // Send WhatsApp notification to customer if enabled
      if (notifyCustomerEnabled && updatedOrder?.customer_phone) {
        const message = generateStatusNotificationMessage(
          newStatus,
          establishmentName,
          orderId
        );
        
        if (message) {
          const whatsappLink = generateWhatsAppLinkToCustomer(
            updatedOrder.customer_phone,
            message
          );
          // Open WhatsApp in new tab
          window.open(whatsappLink, '_blank');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  };

  const getFilteredOrders = (status: string | null) => {
    if (!status) return orders;
    return orders.filter(order => order.status === status);
  };

  const getOrderCounts = () => ({
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    'on-the-way': orders.filter(o => o.status === 'on-the-way').length,
  });

  const counts = getOrderCounts();

  // Daily summary calculation
  const getTodaySummary = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && order.status !== 'cancelled';
    });

    const totalRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
    const deliveryCount = todaysOrders.filter(o => (o as any).delivery_type !== 'pickup').length;
    const pickupCount = todaysOrders.filter(o => (o as any).delivery_type === 'pickup').length;

    return {
      count: todaysOrders.length,
      revenue: totalRevenue,
      deliveries: deliveryCount,
      pickups: pickupCount,
    };
  };

  const todaySummary = getTodaySummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const OrderCard = ({ order }: { order: Order }) => {
    const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
    const StatusIcon = statusInfo.icon;

    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${statusInfo.color} text-white text-xs`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(order.created_at)}
                </span>
              </div>
              {/* Customer info */}
              {order.customer_name && (
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {order.customer_name}
                </p>
              )}
              {order.customer_phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{order.customer_phone}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      const phone = order.customer_phone?.replace(/\D/g, '');
                      window.open(`https://wa.me/55${phone}`, '_blank');
                    }}
                  >
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-foreground font-medium truncate">
                <MapPin className="w-3 h-3 inline mr-1" />
                {order.customer_address}
              </p>
            </div>
            <p className="font-semibold text-primary whitespace-nowrap">
              {formatCurrency(order.total)}
            </p>
          </div>

          <div className="text-xs text-muted-foreground mb-3">
            {(order.items as OrderItem[]).slice(0, 2).map((item, i) => (
              <span key={i}>
                {item.quantity}x {item.product.name}
                {i < Math.min(order.items.length, 2) - 1 && ', '}
              </span>
            ))}
            {order.items.length > 2 && ` +${order.items.length - 2} itens`}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={order.status}
              onValueChange={(value) => updateOrderStatus(order.id, value)}
              disabled={updatingStatus === order.id}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pedido recebido</SelectItem>
                <SelectItem value="preparing">Em preparo</SelectItem>
                <SelectItem value="on-the-way">A caminho</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openOrderDetails(order)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Resumo do Dia */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">
                Hoje, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
              {formatCurrency(todaySummary.revenue)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-background/60 rounded-lg p-2">
              <p className="text-2xl font-bold text-primary">{todaySummary.count}</p>
              <p className="text-xs text-muted-foreground">pedidos</p>
            </div>
            <div className="bg-background/60 rounded-lg p-2">
              <p className="text-2xl font-bold text-purple-600">{todaySummary.deliveries}</p>
              <p className="text-xs text-muted-foreground">entregas</p>
            </div>
            <div className="bg-background/60 rounded-lg p-2">
              <p className="text-2xl font-bold text-orange-600">{todaySummary.pickups}</p>
              <p className="text-xs text-muted-foreground">retiradas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all" className="text-xs">
            Todos ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">
            Recebidos ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="preparing" className="text-xs">
            Preparo ({counts.preparing})
          </TabsTrigger>
          <TabsTrigger value="on-the-way" className="text-xs">
            A caminho ({counts['on-the-way']})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum pedido ainda.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os pedidos aparecerão aqui quando os clientes finalizarem pelo cardápio.
                </p>
              </CardContent>
            </Card>
          ) : (
            orders.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </TabsContent>

        {['pending', 'preparing', 'on-the-way'].map(status => (
          <TabsContent key={status} value={status} className="mt-4">
            {getFilteredOrders(status).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhum pedido com status "{STATUS_LABELS[status]?.label}".
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredOrders(status).map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Badge className={`${STATUS_LABELS[selectedOrder.status]?.color} text-white`}>
                  {STATUS_LABELS[selectedOrder.status]?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Customer Contact Card */}
              {(selectedOrder.customer_name || selectedOrder.customer_phone) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {selectedOrder.customer_name && (
                      <p className="font-medium">{selectedOrder.customer_name}</p>
                    )}
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedOrder.customer_phone}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => {
                            const phone = selectedOrder.customer_phone?.replace(/\D/g, '');
                            window.open(`https://wa.me/55${phone}`, '_blank');
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Endereço de entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{selectedOrder.customer_address}</p>
                  {selectedOrder.reference_point && (
                    <p className="text-muted-foreground">
                      Ref: {selectedOrder.reference_point}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{selectedOrder.payment_method}</p>
                  {selectedOrder.payment_details && (
                    <p className="text-muted-foreground">{selectedOrder.payment_details}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Itens do pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(selectedOrder.items as OrderItem[]).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {item.product.name}
                        </p>
                        {item.selectedAdditions.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            + {item.selectedAdditions.map(a => a.name).join(', ')}
                          </p>
                        )}
                        {item.observations && (
                          <p className="text-xs text-muted-foreground italic">
                            Obs: {item.observations}
                          </p>
                        )}
                      </div>
                      <p className="font-medium">
                        {formatCurrency(
                          (item.product.price +
                            item.selectedAdditions.reduce((a, b) => a + b.price, 0)) *
                            item.quantity
                        )}
                      </p>
                    </div>
                  ))}

                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de entrega</span>
                        <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                      </div>
                    )}
                    {selectedOrder.discount_value > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>
                          Desconto {selectedOrder.discount_code && `(${selectedOrder.discount_code})`}
                        </span>
                        <span>-{formatCurrency(selectedOrder.discount_value)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedOrder.observations && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>{selectedOrder.observations}</p>
                  </CardContent>
                </Card>
              )}

              <Select
                value={selectedOrder.status}
                onValueChange={(value) => {
                  updateOrderStatus(selectedOrder.id, value);
                  setSelectedOrder({ ...selectedOrder, status: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alterar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pedido recebido</SelectItem>
                  <SelectItem value="preparing">Em preparo</SelectItem>
                  <SelectItem value="on-the-way">A caminho</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
