import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, MapPin, CreditCard, Banknote, QrCode, Copy, Check, MessageCircle, AlertTriangle, Loader2, User, Ticket, Package, Clock, Calendar, Store } from 'lucide-react';
import { formatCurrency, generateOrderMessage, openWhatsApp, openPaymentWhatsApp } from '@/lib/whatsapp';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isEstablishmentActive } from '@/lib/utils';
import { BusinessHour, BusinessStatus, checkBusinessStatus, getScheduledOrderMessage, getAvailableScheduleSlots, ScheduleSlot } from '@/lib/businessHours';
import { hexToHsl } from '@/lib/colors';
import { CustomerPushPrompt } from '@/components/CustomerPushPrompt';
import { useCustomer } from '@/hooks/useCustomer';

interface PublicEstablishment {
  id: string;
  name: string;
  logo_url: string | null;
  plan_status: string;
  trial_end_date: string;
  plan_expires_at: string | null;
  delivery_fee: number | null;
  min_order_value: number | null;
  free_delivery_min: number | null;
  accept_pickup: boolean | null;
  allow_orders_when_closed: boolean | null;
  scheduled_orders_message: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

interface EstablishmentContact {
  whatsapp: string;
  pix_key: string | null;
}

interface DeliveryZone {
  id: string;
  neighborhood: string;
  delivery_type: 'paid' | 'free';
  delivery_fee: number;
}

interface SavedAddress {
  id: string;
  address: string;
  neighborhood: string | null;
  reference_point: string | null;
}

function CheckoutContent() {
  const { customer } = useCustomer();
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  
  const [establishment, setEstablishment] = useState<PublicEstablishment | null>(null);
  const [contact, setContact] = useState<EstablishmentContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [planStatus, setPlanStatus] = useState<{ active: boolean; reason: 'trial_expired' | 'plan_expired' | null }>({ active: true, reason: null });
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus>({ isOpen: true, message: 'Aberto', todayHours: null, nextOpenInfo: null });
  const [allowOrdersWhenClosed, setAllowOrdersWhenClosed] = useState(false);
  const [scheduledOrdersMessage, setScheduledOrdersMessage] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  // Delivery zones and saved addresses
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  
  // Scheduled order state
  const [availableSlots, setAvailableSlots] = useState<ScheduleSlot[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; value: number; type: string } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // Push notification prompt state
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [orderEstablishmentId, setOrderEstablishmentId] = useState('');
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryType: 'delivery' as 'delivery' | 'pickup' | 'other',
    neighborhood: '',
    street: '',
    number: '',
    complement: '',
    referencePoint: '',
    paymentMethod: 'pix',
    needsChange: false,
    changeFor: '',
    pixPaidInAdvance: false,
    observations: '',
    saveAddress: false,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEstablishment = async () => {
      const identifier = slug || id;
      if (!identifier) return;
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      try {
        const { data, error } = await supabase
          .from('public_establishments')
          .select('*')
          .eq(isUUID ? 'id' : 'slug', identifier)
          .single();
        
        if (error) {
          console.error('Error fetching establishment:', error);
          toast({
            title: 'Erro',
            description: 'Estabelecimento não encontrado.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        setEstablishment(data as unknown as PublicEstablishment);
        
        const status = isEstablishmentActive({
          plan_status: data.plan_status || 'trial',
          trial_end_date: data.trial_end_date,
          plan_expires_at: data.plan_expires_at,
        });
        setPlanStatus(status);
        
        const establishmentId = data.id;
        
        // Fetch delivery zones
        const { data: zonesData } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('establishment_id', establishmentId)
          .eq('is_active', true)
          .order('neighborhood');
        
        if (zonesData) {
          setDeliveryZones(zonesData.map(z => ({
            ...z,
            delivery_type: z.delivery_type as 'paid' | 'free',
          })));
        }

        // Fetch business hours
        const { data: hoursData } = await supabase
          .from('business_hours')
          .select('*')
          .eq('establishment_id', establishmentId);

        if (hoursData && hoursData.length > 0) {
          setBusinessHours(hoursData);
          const bStatus = checkBusinessStatus(
            hoursData,
            (data as any).allow_orders_when_closed || false,
            (data as any).scheduled_orders_message
          );
          setBusinessStatus(bStatus);
          
          // Generate available slots for scheduling if closed and allows scheduled orders
          if (!bStatus.isOpen && (data as any).allow_orders_when_closed) {
            const slots = getAvailableScheduleSlots(hoursData, 7);
            setAvailableSlots(slots);
            if (slots.length > 0 && slots[0].times.length > 0) {
              setSelectedTime(slots[0].times[0]);
            }
          }
        }

        setAllowOrdersWhenClosed((data as any).allow_orders_when_closed || false);
        setScheduledOrdersMessage((data as any).scheduled_orders_message);
        
        if (status.active && establishmentId) {
          const { data: contactData, error: contactError } = await supabase
            .rpc('get_establishment_contact', { establishment_id: establishmentId });
          
          if (!contactError && contactData && contactData.length > 0) {
            setContact(contactData[0] as EstablishmentContact);
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstablishment();
  }, [id, slug, navigate, toast]);

  // Apply custom colors from establishment
  useEffect(() => {
    if (establishment) {
      const primaryColor = (establishment as any).primary_color || '#4A9BD9';
      const secondaryColor = (establishment as any).secondary_color || '#4CAF50';
      
      document.documentElement.style.setProperty('--menu-primary', hexToHsl(primaryColor));
      document.documentElement.style.setProperty('--menu-secondary', hexToHsl(secondaryColor));
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty('--menu-primary');
      document.documentElement.style.removeProperty('--menu-secondary');
    };
  }, [establishment]);

  // Load saved addresses when phone is entered
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (formData.customerPhone.length >= 10 && establishment) {
        const normalizedPhone = formData.customerPhone.replace(/\D/g, '');
        const { data } = await supabase
          .from('saved_addresses')
          .select('*')
          .eq('whatsapp', normalizedPhone)
          .eq('establishment_id', establishment.id)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (data) {
          setSavedAddresses(data);
        }
      }
    };
    
    loadSavedAddresses();
  }, [formData.customerPhone, establishment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, paymentMethod: value, needsChange: false, changeFor: '' }));
  };

  const selectSavedAddress = (address: SavedAddress) => {
    // If address has structured fields, use them; otherwise parse from address string
    const savedAddr = address as SavedAddress & { street?: string; number?: string; complement?: string };
    if (savedAddr.street) {
      setFormData(prev => ({
        ...prev,
        street: savedAddr.street || '',
        number: savedAddr.number || '',
        complement: savedAddr.complement || '',
        neighborhood: address.neighborhood || '',
        referencePoint: address.reference_point || '',
      }));
    } else {
      // Legacy address - put in street field
      setFormData(prev => ({
        ...prev,
        street: address.address,
        number: '',
        complement: '',
        neighborhood: address.neighborhood || '',
        referencePoint: address.reference_point || '',
      }));
    }
  };

  // Build full address string from structured fields
  const getFullAddress = (): string => {
    const parts = [formData.street];
    if (formData.number) parts.push(formData.number);
    if (formData.complement) parts.push(`- ${formData.complement}`);
    return parts.join(', ');
  };

  // Calculate delivery fee based on neighborhood and settings
  const calculateDeliveryFee = (): { fee: number; message: string } => {
    if (formData.deliveryType === 'pickup') {
      return { fee: 0, message: 'Retirada no local' };
    }

    // Check if free delivery applies
    const freeDeliveryMin = establishment?.free_delivery_min;
    if (freeDeliveryMin && total >= freeDeliveryMin) {
      return { fee: 0, message: `Entrega grátis (pedido acima de ${formatCurrency(freeDeliveryMin)})` };
    }

    // Check neighborhood-specific fee
    if (formData.neighborhood && formData.neighborhood !== 'outros') {
      const zone = deliveryZones.find(z => z.neighborhood === formData.neighborhood);
      if (zone) {
        if (zone.delivery_type === 'free') {
          return { fee: 0, message: 'Entrega grátis neste bairro' };
        }
        return { fee: zone.delivery_fee, message: '' };
      }
    }

    // "Outros" neighborhood
    if (formData.neighborhood === 'outros') {
      return { fee: 0, message: 'Taxa a confirmar pelo estabelecimento' };
    }

    // Default delivery fee
    return { fee: establishment?.delivery_fee || 0, message: '' };
  };

  const deliveryInfo = calculateDeliveryFee();
  const discountValue = appliedCoupon?.value || 0;
  const grandTotal = total + deliveryInfo.fee - discountValue;

  // Validate minimum order
  const minOrderValue = establishment?.min_order_value || 0;
  const isMinOrderMet = total >= minOrderValue;

  const copyPixKey = () => {
    if (contact?.pix_key) {
      navigator.clipboard.writeText(contact.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !establishment) return;
    
    setIsValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('establishment_id', establishment.id)
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: 'Cupom inválido',
          description: 'Este cupom não existe ou está inativo.',
          variant: 'destructive',
        });
        return;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({
          title: 'Cupom expirado',
          description: 'Este cupom já expirou.',
          variant: 'destructive',
        });
        return;
      }

      // Check usage limit
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast({
          title: 'Cupom esgotado',
          description: 'Este cupom atingiu o limite de usos.',
          variant: 'destructive',
        });
        return;
      }

      // Check minimum order value
      if (data.min_order_value && total < data.min_order_value) {
        toast({
          title: 'Valor mínimo não atingido',
          description: `Este cupom requer um pedido mínimo de ${formatCurrency(data.min_order_value)}.`,
          variant: 'destructive',
        });
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (data.discount_type === 'percentage') {
        discountAmount = (total * data.discount_value) / 100;
      } else {
        discountAmount = data.discount_value;
      }

      setAppliedCoupon({
        code: data.code,
        value: discountAmount,
        type: data.discount_type,
      });

      toast({
        title: 'Cupom aplicado!',
        description: `Desconto de ${formatCurrency(discountAmount)} aplicado.`,
      });
    } catch (err) {
      console.error('Error applying coupon:', err);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const getPaymentMethodLabel = () => {
    switch (formData.paymentMethod) {
      case 'cash': return 'Dinheiro';
      case 'card-credit': return 'Cartão de Crédito';
      case 'card-debit': return 'Cartão de Débito';
      case 'pix': return 'Pix';
      default: return '';
    }
  };

  const getPaymentDetails = () => {
    if (formData.paymentMethod === 'cash' && formData.needsChange) {
      return `💵 Precisa de troco para ${formatCurrency(Number(formData.changeFor))}`;
    }
    if (formData.paymentMethod === 'pix') {
      return formData.pixPaidInAdvance 
        ? '✅ Cliente pagou via Pix antecipado' 
        : '⏳ Pagará via Pix na entrega';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!establishment || !contact) return;
    
    if (!formData.customerName.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha seu nome.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.deliveryType === 'delivery' && !formData.street) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha a rua.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.deliveryType === 'delivery' && !formData.number) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha o número.',
        variant: 'destructive',
      });
      return;
    }

    if (!isMinOrderMet) {
      toast({
        title: 'Valor mínimo não atingido',
        description: `O pedido mínimo é de ${formatCurrency(minOrderValue)}.`,
        variant: 'destructive',
      });
      return;
    }

    // Save address if requested
    const fullAddress = getFullAddress();
    if (formData.saveAddress && formData.customerPhone && fullAddress) {
      const normalizedPhone = formData.customerPhone.replace(/\D/g, '');
      
      // Check if we already have 3 addresses
      if (savedAddresses.length >= 3) {
        // Delete oldest
        const oldest = savedAddresses[savedAddresses.length - 1];
        await supabase.from('saved_addresses').delete().eq('id', oldest.id);
      }

      await supabase.from('saved_addresses').insert({
        whatsapp: normalizedPhone,
        establishment_id: establishment.id,
        address: fullAddress,
        street: formData.street || null,
        number: formData.number || null,
        complement: formData.complement || null,
        neighborhood: formData.neighborhood || null,
        reference_point: formData.referencePoint || null,
      });
    }

    // Save order to database
    const orderItems = items.map(item => ({
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
      },
      quantity: item.quantity,
      selectedAdditions: item.selectedAdditions.map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
      selectedOptions: item.selectedOptions.map(g => ({
        groupId: g.groupId,
        groupName: g.groupName,
        options: g.options.map(o => ({
          id: o.id,
          name: o.name,
          price: o.price,
        })),
      })),
      observations: item.observations,
    }));

    try {
      // Build scheduled date/time if this is a scheduled order
      const isScheduledOrder = !businessStatus.isOpen && allowOrdersWhenClosed;
      let scheduledDate: string | null = null;
      let scheduledTime: string | null = null;
      
      if (isScheduledOrder && availableSlots.length > 0 && selectedTime) {
        const slot = availableSlots[selectedSlotIndex];
        if (slot) {
          scheduledDate = slot.date.toISOString().split('T')[0];
          scheduledTime = selectedTime;
        }
      }
      
      const { error } = await supabase
        .from('orders')
        .insert({
          establishment_id: establishment.id,
          customer_name: formData.customerName.trim(),
          customer_phone: formData.customerPhone.replace(/\D/g, '') || null,
          customer_address: formData.deliveryType === 'pickup' ? 'Retirada no local' : getFullAddress(),
          neighborhood: formData.neighborhood || null,
          reference_point: formData.referencePoint || null,
          delivery_type: formData.deliveryType,
          payment_method: getPaymentMethodLabel(),
          payment_details: getPaymentDetails() || null,
          subtotal: total,
          delivery_fee: deliveryInfo.fee,
          discount_value: discountValue,
          discount_code: appliedCoupon?.code || null,
          total: grandTotal,
          status: 'pending',
          observations: formData.observations || null,
          items: orderItems,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          customer_id: customer?.id || null,
        });

      if (error) {
        console.error('Error saving order:', error);
      } else {
        // Enviar push notification para o lojista
        try {
          await supabase.functions.invoke('send-store-push-notification', {
            body: {
              order_id: `order-${Date.now()}`,
              establishment_id: establishment.id,
              customer_name: formData.customerName.trim(),
              total: grandTotal,
            },
          });
        } catch (pushError) {
          console.log('Push to store failed (optional):', pushError);
        }
      }

      // Update coupon usage
      if (appliedCoupon) {
        await supabase
          .from('discount_codes')
          .update({ current_uses: (appliedCoupon as any).current_uses + 1 })
          .eq('code', appliedCoupon.code);
      }
    } catch (err) {
      console.error('Error saving order:', err);
    }

    // Determine if this is a scheduled order (made when closed)
    const isScheduledOrderFinal = !businessStatus.isOpen && allowOrdersWhenClosed;
    const scheduledMessage = isScheduledOrderFinal 
      ? getScheduledOrderMessage(true, scheduledOrdersMessage)
      : undefined;
    
    // Build scheduled date/time for WhatsApp message
    let scheduledDateTimeForMessage: { date: string; time: string } | undefined;
    if (isScheduledOrderFinal && availableSlots.length > 0 && selectedTime) {
      const slot = availableSlots[selectedSlotIndex];
      if (slot) {
        scheduledDateTimeForMessage = {
          date: slot.date.toISOString().split('T')[0],
          time: selectedTime,
        };
      }
    }

    const message = generateOrderMessage(
      establishment.name || '',
      items,
      formData.customerName,
      getFullAddress(),
      formData.neighborhood || 'Não informado',
      formData.referencePoint,
      formData.deliveryType,
      getPaymentMethodLabel(),
      getPaymentDetails(),
      total,
      deliveryInfo.fee,
      discountValue,
      appliedCoupon?.code || null,
      formData.observations,
      isScheduledOrderFinal,
      scheduledMessage || undefined,
      scheduledDateTimeForMessage
    );

    openWhatsApp(contact.whatsapp, message);
    clearCart();
    
    toast({
      title: 'Pedido enviado!',
      description: 'Seu pedido foi enviado para o WhatsApp do estabelecimento.',
    });

    // Show push notification prompt after successful order
    if (formData.customerPhone && establishment) {
      setOrderEstablishmentId(establishment.id);
      setShowPushPrompt(true);
    } else {
      navigate(`/${slug || id}`);
    }
  };

  const handlePushPromptClose = () => {
    setShowPushPrompt(false);
    navigate(`/${slug || id}`);
  };

  const handleActivatePlan = () => {
    if (establishment) {
      openPaymentWhatsApp(establishment.name || '', planStatus.reason === 'trial_expired');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Estabelecimento não encontrado</p>
            <Link to="/">
              <Button>Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!planStatus.active) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Store className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground">
              Estabelecimento Indisponível
            </h2>
            
            <p className="text-muted-foreground">
              Este estabelecimento não está recebendo pedidos no momento. 
              Por favor, tente novamente mais tarde.
            </p>
            
            <div className="pt-4">
              <Link to={`/${slug || id}`} className="block">
                <Button variant="outline" size="lg" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao cardápio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
            <Link to={`/${slug || id}`}>
              <Button>Voltar ao cardápio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center gap-4 h-14">
          <Link to={`/${slug || id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">Finalizar pedido</h1>
        </div>
      </header>

      <main className="container py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                Seus dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Seu nome *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  placeholder="Como podemos te chamar?"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerPhone">WhatsApp (opcional)</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.customerPhone}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                Tipo de entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.deliveryType}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  deliveryType: value as 'delivery' | 'pickup' | 'other' 
                }))}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                    Entrega no meu endereço
                  </Label>
                </div>
                
                {establishment.accept_pickup && (
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      Retirar no local
                    </Label>
                  </div>
                )}
              </RadioGroup>

              {formData.deliveryType === 'delivery' && (
                <div className="space-y-4 pt-2">
                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Endereços salvos</Label>
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => selectSavedAddress(addr)}
                            className="w-full text-left p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                          >
                            <p className="text-sm font-medium text-foreground">{addr.address}</p>
                            {addr.neighborhood && (
                              <p className="text-xs text-muted-foreground">{addr.neighborhood}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Neighborhood selection */}
                  {deliveryZones.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Select 
                        value={formData.neighborhood} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, neighborhood: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o bairro" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryZones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.neighborhood}>
                              {zone.neighborhood} 
                              {zone.delivery_type === 'free' 
                                ? ' (Grátis)' 
                                : ` (${formatCurrency(zone.delivery_fee)})`
                              }
                            </SelectItem>
                          ))}
                          <SelectItem value="outros">Outros (taxa a confirmar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="street">Rua/Avenida *</Label>
                    <Input
                      id="street"
                      name="street"
                      placeholder="Nome da rua ou avenida"
                      value={formData.street}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        name="number"
                        placeholder="123"
                        value={formData.number}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        name="complement"
                        placeholder="Apto, bloco..."
                        value={formData.complement}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="referencePoint">Ponto de referência</Label>
                    <Input
                      id="referencePoint"
                      name="referencePoint"
                      placeholder="Ex: Próximo ao mercado..."
                      value={formData.referencePoint}
                      onChange={handleChange}
                    />
                  </div>

                  {formData.customerPhone && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={formData.saveAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, saveAddress: e.target.checked }))}
                        className="rounded border-border"
                      />
                      <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                        Salvar endereço para próximos pedidos
                      </Label>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-primary" />
                Forma de pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={handlePaymentChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                    <QrCode className="w-5 h-5 text-secondary" />
                    Pix
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="card-credit" id="card-credit" />
                  <Label htmlFor="card-credit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Cartão de Crédito
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="card-debit" id="card-debit" />
                  <Label htmlFor="card-debit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Cartão de Débito
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="w-5 h-5 text-secondary" />
                    Dinheiro
                  </Label>
                </div>
              </RadioGroup>

              {/* Pix details */}
              {formData.paymentMethod === 'pix' && contact?.pix_key && (
                <div className="mt-4 p-4 bg-secondary/10 rounded-xl border border-secondary/20">
                  <p className="text-sm font-medium text-foreground mb-2">Chave Pix do estabelecimento:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-card p-2 rounded text-sm break-all">
                      {contact.pix_key}
                    </code>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      onClick={copyPixKey}
                    >
                      {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm">Quando vai pagar?</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={formData.pixPaidInAdvance ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, pixPaidInAdvance: true }))}
                      >
                        Pagar agora
                      </Button>
                      <Button
                        type="button"
                        variant={!formData.pixPaidInAdvance ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, pixPaidInAdvance: false }))}
                      >
                        Na entrega
                      </Button>
                    </div>
                    {formData.pixPaidInAdvance && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Envie o comprovante junto com o pedido no WhatsApp.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cash change */}
              {formData.paymentMethod === 'cash' && (
                <div className="mt-4 p-4 bg-muted rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="needsChange"
                      checked={formData.needsChange}
                      onChange={(e) => setFormData(prev => ({ ...prev, needsChange: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <Label htmlFor="needsChange" className="cursor-pointer">
                      Preciso de troco
                    </Label>
                  </div>
                  
                  {formData.needsChange && (
                    <div className="space-y-2">
                      <Label htmlFor="changeFor">Troco para quanto?</Label>
                      <Input
                        id="changeFor"
                        name="changeFor"
                        type="number"
                        placeholder="Ex: 50"
                        value={formData.changeFor}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coupon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ticket className="w-5 h-5 text-primary" />
                Cupom de desconto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                  <div>
                    <p className="font-medium text-foreground">{appliedCoupon.code}</p>
                    <p className="text-sm text-secondary">-{formatCurrency(appliedCoupon.value)}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={removeCoupon}>
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={applyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                  >
                    {isValidatingCoupon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Aplicar'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="observations"
                placeholder="Alguma observação sobre o pedido ou entrega?"
                value={formData.observations}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-foreground">
                      {formatCurrency(
                        (item.product.price + item.selectedAdditions.reduce((a, b) => a + b.price, 0)) * item.quantity
                      )}
                    </span>
                  </div>
                ))}
                
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>
                      {deliveryInfo.fee === 0 
                        ? (deliveryInfo.message || 'Grátis')
                        : formatCurrency(deliveryInfo.fee)
                      }
                    </span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-secondary">
                      <span>Desconto ({appliedCoupon.code})</span>
                      <span>-{formatCurrency(appliedCoupon.value)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold text-lg pt-1">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Minimum order warning */}
                {!isMinOrderMet && minOrderValue > 0 && (
                  <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning">
                      Pedido mínimo: {formatCurrency(minOrderValue)}. Faltam {formatCurrency(minOrderValue - total)}.
                    </p>
                  </div>
                )}

                {/* Business hours closed warning */}
                {!businessStatus.isOpen && !allowOrdersWhenClosed && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-destructive" />
                      <p className="font-medium text-destructive">Estabelecimento fechado</p>
                    </div>
                    <p className="text-sm text-destructive/80">
                      {businessStatus.nextOpenInfo || 'Não é possível fazer pedidos no momento.'}
                    </p>
                  </div>
                )}

                {/* Scheduled order info with time selector */}
                {!businessStatus.isOpen && allowOrdersWhenClosed && (
                  <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning" />
                      <p className="font-medium text-warning">Agendar pedido</p>
                    </div>
                    
                    {availableSlots.length > 0 ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm text-warning/80 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Dia do pedido
                          </Label>
                          <Select 
                            value={String(selectedSlotIndex)} 
                            onValueChange={(value) => {
                              const idx = Number(value);
                              setSelectedSlotIndex(idx);
                              if (availableSlots[idx]?.times.length > 0) {
                                setSelectedTime(availableSlots[idx].times[0]);
                              }
                            }}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Selecione o dia" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSlots.map((slot, idx) => (
                                <SelectItem key={idx} value={String(idx)}>
                                  {slot.dayLabel} ({slot.dateLabel})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm text-warning/80 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Horário desejado
                          </Label>
                          <Select 
                            value={selectedTime} 
                            onValueChange={setSelectedTime}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSlots[selectedSlotIndex]?.times.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <p className="text-xs text-warning/60">
                          {scheduledOrdersMessage || 'Seu pedido será preparado no horário selecionado.'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-warning/80">
                        {scheduledOrdersMessage || 'Estamos fechados, mas você pode fazer seu pedido. Será preparado quando reabrirmos.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
        {!businessStatus.isOpen && !allowOrdersWhenClosed ? (
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            disabled
          >
            <Clock className="w-5 h-5 mr-2" />
            Fechado - {businessStatus.nextOpenInfo || 'Volte mais tarde'}
          </Button>
        ) : (
          <Button 
            variant="whatsapp" 
            size="lg" 
            className="w-full"
            onClick={handleSubmit}
            disabled={!isMinOrderMet}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {!businessStatus.isOpen && allowOrdersWhenClosed 
              ? 'Agendar pedido via WhatsApp' 
              : 'Enviar pedido via WhatsApp'}
          </Button>
        )}
      </div>

      {/* Push Notification Prompt */}
      <CustomerPushPrompt
        isOpen={showPushPrompt}
        onClose={handlePushPromptClose}
        establishmentId={orderEstablishmentId}
        establishmentName={establishment?.name || ''}
        customerPhone={formData.customerPhone.replace(/\D/g, '')}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return <CheckoutContent />;
}
