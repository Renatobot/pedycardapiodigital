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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Clock, MapPin, CreditCard, Package, Truck, CheckCircle, XCircle, Eye, Loader2, MessageCircle, Phone, User, Calendar as CalendarIcon, Volume2, VolumeX, Bell, BellOff, Trash2, History, Check } from 'lucide-react';
import { formatCurrency, generateStatusNotificationMessage, generateWhatsAppLinkToCustomer } from '@/lib/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStorePushNotifications } from '@/hooks/useStorePushNotifications';

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
  is_registered_customer?: boolean;
  customer_order_count?: number;
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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const [unviewedOrderIds, setUnviewedOrderIds] = useState<string[]>([]);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  
  // History tab states
  const [historyDate, setHistoryDate] = useState<Date | undefined>(undefined);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const { toast } = useToast();
  const { 
    isSupported: pushSupported, 
    isSubscribed: pushEnabled, 
    isLoading: pushLoading, 
    isIOS,
    isPWAInstalled,
    subscribe: subscribePush, 
    unsubscribe: unsubscribePush 
  } = useStorePushNotifications();
  
  // Audio ref for new order notification
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Wake Lock ref
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  // Initialize audio on mount and check stored preference
  useEffect(() => {
    audioRef.current = new Audio('/sounds/new-order.mp3');
    audioRef.current.volume = 1.0; // VOLUME MÁXIMO
    audioRef.current.loop = true; // SOM EM LOOP CONTÍNUO
    
    // Check if sound was previously enabled
    const storedSoundEnabled = localStorage.getItem('orderSoundEnabled');
    if (storedSoundEnabled === 'true') {
      setSoundEnabled(true);
    }

    return () => {
      // Stop audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      // Release wake lock on unmount
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
      }
    };
  }, []);

  // Stop continuous sound
  const stopContinuousSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log('[OrderManagement] Continuous sound stopped');
    }
  };

  // Start continuous sound
  const startContinuousSound = () => {
    if (audioRef.current && soundEnabled && soundUnlocked) {
      audioRef.current.volume = 1.0;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      console.log('[OrderManagement] Continuous sound started');
    }
  };

  // Manage continuous sound for unviewed pending orders
  useEffect(() => {
    // Check for unviewed PENDING orders only
    const hasUnviewedPendingOrders = orders.some(
      order => order.status === 'pending' && unviewedOrderIds.includes(order.id)
    );
    
    console.log('[OrderManagement] Unviewed pending orders:', hasUnviewedPendingOrders, 'Sound enabled:', soundEnabled, 'Unlocked:', soundUnlocked);
    
    if (hasUnviewedPendingOrders && soundEnabled && soundUnlocked) {
      // Start continuous loop sound
      startContinuousSound();
    } else {
      // Stop sound
      stopContinuousSound();
    }

    // Manage Wake Lock
    const manageWakeLock = async () => {
      if (hasUnviewedPendingOrders && 'wakeLock' in navigator) {
        try {
          if (!wakeLockRef.current) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.log('[OrderManagement] Wake Lock acquired');
          }
        } catch (err) {
          console.log('[OrderManagement] Wake Lock failed:', err);
        }
      } else if (!hasUnviewedPendingOrders && wakeLockRef.current) {
        await wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
        console.log('[OrderManagement] Wake Lock released');
      }
    };
    manageWakeLock();

  }, [orders, unviewedOrderIds, soundEnabled, soundUnlocked]);

  // Mark order as viewed (removes from unviewed list)
  const markOrderAsViewed = (orderId: string) => {
    setUnviewedOrderIds(prev => prev.filter(id => id !== orderId));
  };

  const enableSound = async () => {
    if (audioRef.current) {
      try {
        audioRef.current.volume = 1.0; // VOLUME MÁXIMO
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        
        setSoundUnlocked(true);
        setSoundEnabled(true);
        localStorage.setItem('orderSoundEnabled', 'true');
        
        toast({
          title: '🔊 Som ativado!',
          description: 'Você será notificado quando novos pedidos chegarem.',
        });
      } catch (error) {
        console.error('Failed to enable sound:', error);
        toast({
          title: 'Erro ao ativar som',
          description: 'Clique novamente para tentar.',
          variant: 'destructive',
        });
      }
    }
  };

  const toggleSound = () => {
    if (!soundUnlocked) {
      enableSound();
    } else {
      const newValue = !soundEnabled;
      setSoundEnabled(newValue);
      localStorage.setItem('orderSoundEnabled', String(newValue));
      toast({
        title: newValue ? '🔊 Som ativado' : '🔇 Som desativado',
        description: newValue 
          ? 'Você receberá notificações sonoras.' 
          : 'As notificações sonoras foram desativadas.',
      });
    }
  };

  const testPushNotification = async () => {
    try {
      toast({
        title: '🔔 Enviando teste...',
        description: 'Aguarde a notificação chegar.',
      });

      const { data, error } = await supabase.functions.invoke('send-store-push-notification', {
        body: {
          order_id: 'test-' + Date.now(),
          establishment_id: establishmentId,
          customer_name: 'Teste de Notificação',
          total: 99.90,
        },
      });

      if (error) throw error;

      console.log('Push test result:', data);
      
      toast({
        title: '✅ Teste enviado!',
        description: 'Se configurado corretamente, você receberá uma notificação.',
      });
    } catch (error) {
      console.error('Push test failed:', error);
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível enviar. Verifique os logs.',
        variant: 'destructive',
      });
    }
  };

  // Fetch orders for today only (default)
  const fetchOrders = async () => {
    try {
      // Início do dia atual (00:00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('establishment_id', establishmentId)
        .gte('created_at', today.toISOString())
        .lte('created_at', endOfToday.toISOString())
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

  // Fetch orders for a specific date (history)
  const fetchHistoryOrders = async (date: Date) => {
    setLoadingHistory(true);
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('establishment_id', establishmentId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setHistoryOrders((data || []).map((order: any) => ({
        ...order,
        items: order.items as OrderItem[],
      })));
    } catch (error) {
      console.error('Error fetching history orders:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: 'Não foi possível buscar os pedidos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Delete an order
  const deleteOrder = async (orderId: string) => {
    setDeletingOrder(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      // Remove from local state (today's orders or history)
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setHistoryOrders(prev => prev.filter(order => order.id !== orderId));
      
      // Remove from unviewed list if exists
      markOrderAsViewed(orderId);
      
      // Close dialog if this order was open
      if (selectedOrder?.id === orderId) {
        setDetailsOpen(false);
      }
      
      toast({
        title: '🗑️ Pedido excluído',
        description: 'O pedido foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o pedido.',
        variant: 'destructive',
      });
    } finally {
      setDeletingOrder(null);
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
        (payload: any) => {
          const newOrderId = payload.new?.id;
          console.log('[OrderManagement] New order received:', newOrderId);
          
          // Add to unviewed orders list
          if (newOrderId) {
            setUnviewedOrderIds(prev => [...prev, newOrderId]);
          }
          
          // The continuous sound will start automatically via useEffect
          // when unviewedOrderIds updates and orders are fetched
          

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
  }, [establishmentId, toast, soundEnabled]);

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

      // Mark order as viewed when status is changed (stops alert)
      markOrderAsViewed(orderId);

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
    // Mark order as viewed when details are opened
    markOrderAsViewed(order.id);
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

  // Daily summary calculation (from today's orders)
  const getTodaySummary = () => {
    const todaysOrders = orders.filter(order => order.status !== 'cancelled');

    const totalRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
    const deliveryCount = todaysOrders.filter(o => o.delivery_type !== 'pickup').length;
    const pickupCount = todaysOrders.filter(o => o.delivery_type === 'pickup').length;

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

  const OrderCard = ({ order, showDeleteButton = false }: { order: Order; showDeleteButton?: boolean }) => {
    const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
    const StatusIcon = statusInfo.icon;
    const isPending = order.status === 'pending';
    const isUnviewed = unviewedOrderIds.includes(order.id);

    return (
      <Card className={`mb-3 transition-all ${
        isPending && isUnviewed 
          ? 'ring-2 ring-green-500 ring-offset-2 shadow-lg shadow-green-100 animate-pulse' 
          : ''
      }`}>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {order.customer_name}
                  </p>
                  {/* Badge de cliente cadastrado/não cadastrado */}
                  {order.is_registered_customer ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-1.5 py-0">
                      🟢 Cadastrado {order.customer_order_count ? `(${order.customer_order_count})` : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-muted text-xs px-1.5 py-0">
                      Sem cadastro
                    </Badge>
                  )}
                </div>
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

          {/* ACEITAR PEDIDO button - only for pending orders */}
          {isPending && (
            <Button
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              disabled={updatingStatus === order.id}
              className="w-full mb-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base gap-2 shadow-lg"
              size="lg"
            >
              {updatingStatus === order.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              ACEITAR PEDIDO
            </Button>
          )}

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
            
            {/* Delete Button with confirmation */}
            {showDeleteButton && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                    disabled={deletingOrder === order.id}
                  >
                    {deletingOrder === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O pedido será removido permanentemente do sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => deleteOrder(order.id)}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Notification Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Pedidos</h2>
        <div className="flex items-center gap-2">
          {/* Push Notification Button - shows if supported OR if iOS without PWA (to show warning) */}
          {pushSupported ? (
            <Button
              variant={pushEnabled ? "outline" : "default"}
              size="sm"
              onClick={async () => {
                if (pushEnabled) {
                  const success = await unsubscribePush();
                  if (success) {
                    toast({ title: '🔕 Push desativado', description: 'Você não receberá mais notificações push.' });
                  }
                } else {
                  const success = await subscribePush(establishmentId);
                  if (success) {
                    toast({ title: '🔔 Push ativado!', description: 'Você receberá notificações mesmo com o navegador fechado.' });
                  } else {
                    toast({ title: 'Erro', description: 'Não foi possível ativar as notificações.', variant: 'destructive' });
                  }
                }
              }}
              disabled={pushLoading}
              className={`gap-2 ${pushEnabled ? 'border-green-500 text-green-600 hover:bg-green-50' : ''}`}
            >
              {pushLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : pushEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{pushEnabled ? 'Push ativo' : 'Ativar Push'}</span>
            </Button>
          ) : isIOS && !isPWAInstalled ? (
            /* iOS without PWA installed - show informative button */
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: '📱 Instale o app primeiro',
                  description: 'No iPhone/iPad, toque no ícone de compartilhar ⬆️ e depois "Adicionar à Tela de Início" para receber notificações.',
                });
              }}
              className="gap-2 border-amber-400 text-amber-600 hover:bg-amber-50"
            >
              <BellOff className="h-4 w-4" />
              <span className="hidden sm:inline">Push (instale o app)</span>
            </Button>
          ) : null}
          
          {/* Test Push Button - only when push is enabled */}
          {pushEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={testPushNotification}
              className="gap-2 text-muted-foreground hover:text-foreground"
              title="Testar notificação push"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Testar</span>
            </Button>
          )}
          
          {/* Sound Button */}
          <Button
            variant={soundEnabled ? "outline" : "default"}
            size="sm"
            onClick={toggleSound}
            className={`gap-2 ${!soundEnabled && !soundUnlocked ? 'animate-pulse bg-yellow-500 hover:bg-yellow-600 text-white' : ''} ${soundEnabled ? 'border-green-500 text-green-600 hover:bg-green-50' : ''}`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">Som ativado</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                <span className="hidden sm:inline">Ativar som</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* iOS PWA Warning Banner */}
      {isIOS && !isPWAInstalled && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
          <Bell className="h-4 w-4 flex-shrink-0" />
          <span>
            📱 <strong>iPhone/iPad:</strong> Para receber notificações push, instale o app na tela inicial. 
            Toque no ícone de compartilhar ⬆️ e depois em "Adicionar à Tela de Início".
          </span>
        </div>
      )}

      {/* Resumo do Dia */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
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
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="all" className="text-xs">
            Hoje ({orders.length})
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
          <TabsTrigger value="history" className="text-xs flex items-center gap-1">
            <History className="w-3 h-3" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum pedido hoje.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os pedidos aparecerão aqui quando os clientes finalizarem pelo cardápio.
                </p>
              </CardContent>
            </Card>
          ) : (
            orders.map(order => <OrderCard key={order.id} order={order} showDeleteButton />)
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
                <OrderCard key={order.id} order={order} showDeleteButton />
              ))
            )}
          </TabsContent>
        ))}

        {/* History Tab */}
        <TabsContent value="history" className="mt-4 space-y-4">
          {/* Date Picker */}
          <div className="flex items-center gap-3 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {historyDate
                    ? historyDate.toLocaleDateString('pt-BR')
                    : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={historyDate}
                  onSelect={(date) => {
                    setHistoryDate(date);
                    if (date) fetchHistoryOrders(date);
                  }}
                  disabled={(date) => date > new Date()}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {historyDate && (
              <span className="text-sm text-muted-foreground">
                {loadingHistory ? 'Carregando...' : `${historyOrders.length} pedido(s) encontrado(s)`}
              </span>
            )}
          </div>

          {/* History Orders List */}
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !historyDate ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Selecione uma data para ver os pedidos anteriores.
                </p>
              </CardContent>
            </Card>
          ) : historyOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum pedido em {historyDate.toLocaleDateString('pt-BR')}.
                </p>
              </CardContent>
            </Card>
          ) : (
            historyOrders.map(order => (
              <OrderCard key={order.id} order={order} showDeleteButton />
            ))
          )}
        </TabsContent>
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

              <div className="flex gap-2">
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => {
                    updateOrderStatus(selectedOrder.id, value);
                    setSelectedOrder({ ...selectedOrder, status: value });
                  }}
                >
                  <SelectTrigger className="flex-1">
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

                {/* Delete button in details dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                      disabled={deletingOrder === selectedOrder.id}
                    >
                      {deletingOrder === selectedOrder.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O pedido será removido permanentemente do sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => deleteOrder(selectedOrder.id)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
