import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ticket, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/whatsapp';

interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
}

interface CouponManagementProps {
  establishmentId: string;
}

export function CouponManagement({ establishmentId }: CouponManagementProps) {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCode | null>(null);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
  const [togglingCouponId, setTogglingCouponId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<DiscountCode | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderValue: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, [establishmentId]);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data || []) as DiscountCode[]);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      maxUses: '',
      expiresAt: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditCoupon = (coupon: DiscountCode) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value.toString(),
      minOrderValue: coupon.min_order_value?.toString() || '',
      maxUses: coupon.max_uses?.toString() || '',
      expiresAt: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
      isActive: coupon.is_active,
    });
    setModalOpen(true);
  };

  const handleSaveCoupon = async () => {
    if (!formData.code.trim() || !formData.discountValue) {
      toast({
        title: 'Erro',
        description: 'Código e valor do desconto são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const couponData = {
        establishment_id: establishmentId,
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discountType,
        discount_value: parseFloat(formData.discountValue.replace(',', '.')) || 0,
        min_order_value: parseFloat(formData.minOrderValue.replace(',', '.')) || 0,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
        expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        is_active: formData.isActive,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('discount_codes')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        
        setCoupons(prev => prev.map(c => 
          c.id === editingCoupon.id ? { ...c, ...couponData } as DiscountCode : c
        ));
        toast({ title: 'Cupom atualizado!' });
      } else {
        const { data, error } = await supabase
          .from('discount_codes')
          .insert(couponData)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Falha ao criar cupom');
        setCoupons(prev => [data as DiscountCode, ...prev]);
        toast({ title: 'Cupom criado!' });
      }

      setModalOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cupom.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirm = (coupon: DiscountCode) => {
    setCouponToDelete(coupon);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete || deletingCouponId) return;
    
    setDeletingCouponId(couponToDelete.id);
    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', couponToDelete.id);

      if (error) throw error;
      setCoupons(prev => prev.filter(c => c.id !== couponToDelete.id));
      toast({ title: 'Cupom removido!' });
      setDeleteConfirmOpen(false);
      setCouponToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o cupom.',
        variant: 'destructive',
      });
    } finally {
      setDeletingCouponId(null);
    }
  };

  const toggleCouponStatus = async (coupon: DiscountCode) => {
    if (togglingCouponId) return; // Prevent multiple clicks
    
    setTogglingCouponId(coupon.id);
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      setCoupons(prev => prev.map(c => 
        c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
      ));
      toast({ 
        title: coupon.is_active ? 'Cupom desativado' : 'Cupom ativado' 
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o cupom.',
        variant: 'destructive',
      });
    } finally {
      setTogglingCouponId(null);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDiscount = (coupon: DiscountCode) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return formatCurrency(coupon.discount_value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Cupons de Desconto
            </CardTitle>
            <Button size="sm" onClick={openAddCoupon}>
              <Plus className="w-4 h-4 mr-1" />
              Criar cupom
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum cupom criado ainda.
              </p>
              <Button onClick={openAddCoupon}>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro cupom
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    !coupon.is_active || isExpired(coupon.expires_at) 
                      ? 'bg-muted/50 opacity-60' 
                      : 'bg-card'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-foreground bg-muted px-2 py-1 rounded">
                        {coupon.code}
                      </code>
                      <Badge variant={coupon.is_active && !isExpired(coupon.expires_at) ? 'default' : 'secondary'}>
                        {formatDiscount(coupon)}
                      </Badge>
                      {isExpired(coupon.expires_at) && (
                        <Badge variant="destructive">Expirado</Badge>
                      )}
                      {!coupon.is_active && (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {coupon.min_order_value > 0 && (
                        <span>Mín: {formatCurrency(coupon.min_order_value)}</span>
                      )}
                      {coupon.max_uses && (
                        <span>Usos: {coupon.current_uses}/{coupon.max_uses}</span>
                      )}
                      {coupon.expires_at && (
                        <span>
                          Até: {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={coupon.is_active}
                      disabled={togglingCouponId === coupon.id}
                      onCheckedChange={() => toggleCouponStatus(coupon)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openEditCoupon(coupon)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      disabled={deletingCouponId === coupon.id}
                      onClick={() => openDeleteConfirm(coupon)}
                    >
                      {deletingCouponId === coupon.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Editar cupom' : 'Criar cupom'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do cupom</Label>
              <Input
                id="code"
                placeholder="Ex: PROMO10, BEMVINDO..."
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  code: e.target.value.toUpperCase() 
                }))}
                className="uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de desconto</Label>
                <Select 
                  value={formData.discountType} 
                  onValueChange={(value: 'percentage' | 'fixed') => 
                    setFormData(prev => ({ ...prev, discountType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Valor {formData.discountType === 'percentage' ? '(%)' : '(R$)'}
                </Label>
                <Input
                  id="discountValue"
                  placeholder={formData.discountType === 'percentage' ? '10' : '5,00'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderValue">Valor mínimo do pedido (R$)</Label>
              <Input
                id="minOrderValue"
                placeholder="0,00 (opcional)"
                value={formData.minOrderValue}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrderValue: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Limite de usos</Label>
                <Input
                  id="maxUses"
                  placeholder="Ilimitado"
                  value={formData.maxUses}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Válido até</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label htmlFor="isActive">Cupom ativo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCoupon} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingCoupon ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o cupom "{couponToDelete?.code}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingCouponId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCoupon}
              disabled={!!deletingCouponId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingCouponId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
