import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { useCustomer, CustomerAddress } from '@/hooks/useCustomer';
import CustomerAddressList from './CustomerAddressList';
import CustomerAddressForm, { AddressFormData } from './CustomerAddressForm';
import CustomerOrderHistory from './CustomerOrderHistory';
import { 
  User, 
  MapPin, 
  Package, 
  LogOut, 
  Pencil, 
  ChevronRight,
  Loader2,
  Phone
} from 'lucide-react';

interface CustomerProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId?: string;
  establishmentName?: string;
}

export default function CustomerProfileModal({
  open,
  onOpenChange,
  establishmentId,
  establishmentName,
}: CustomerProfileModalProps) {
  const { customer, logout, updateCustomer, getAddresses, addAddress, updateAddress, deleteAddress } = useCustomer();
  const { toast } = useToast();
  
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<CustomerAddress | null>(null);
  
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const loadAddresses = useCallback(async () => {
    if (!customer) return;
    setLoadingAddresses(true);
    const addrs = await getAddresses();
    setAddresses(addrs);
    setLoadingAddresses(false);
  }, [customer, getAddresses]);

  useEffect(() => {
    if (open && customer) {
      setEditName(customer.name);
      loadAddresses();
    }
  }, [open, customer, loadAddresses]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite seu nome completo',
        variant: 'destructive',
      });
      return;
    }

    setSavingProfile(true);
    const result = await updateCustomer({ name: editName.trim() });
    setSavingProfile(false);

    if (result.success) {
      toast({ title: 'Perfil atualizado!' });
      setEditingProfile(false);
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleSaveAddress = async (data: AddressFormData) => {
    setSavingAddress(true);
    
    if (editingAddress) {
      const result = await updateAddress(editingAddress.id, {
        label: data.label,
        street: data.street,
        number: data.number,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood || undefined,
        reference_point: data.referencePoint || undefined,
        is_default: data.isDefault,
      });
      
      if (result.success) {
        toast({ title: 'Endereço atualizado!' });
        setEditingAddress(null);
        setShowAddressForm(false);
        loadAddresses();
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } else {
      const result = await addAddress({
        label: data.label,
        street: data.street,
        number: data.number,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood || undefined,
        reference_point: data.referencePoint || undefined,
        is_default: data.isDefault,
      });
      
      if (result.success) {
        toast({ title: 'Endereço adicionado!' });
        setShowAddressForm(false);
        loadAddresses();
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    }
    
    setSavingAddress(false);
  };

  const handleDeleteAddress = async () => {
    if (!deletingAddress) return;
    
    const result = await deleteAddress(deletingAddress.id);
    if (result.success) {
      toast({ title: 'Endereço removido!' });
      loadAddresses();
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
    setDeletingAddress(null);
  };

  const handleLogout = () => {
    logout();
    onOpenChange(false);
    toast({ title: 'Você saiu da sua conta' });
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  if (!customer) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Meu Perfil
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Establishment Context Badge */}
            {establishmentName && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Você está em:</p>
                <p className="font-semibold text-primary">{establishmentName}</p>
              </div>
            )}
            
            {/* Profile Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dados pessoais
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{customer.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {formatPhone(customer.whatsapp)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Addresses Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Meus endereços
                  </h3>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  Seus endereços salvos funcionam em todos os cardápios
                </p>
                
                {loadingAddresses ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <CustomerAddressList
                    addresses={addresses}
                    onSelect={() => {}}
                    onEdit={(addr) => {
                      setEditingAddress(addr);
                      setShowAddressForm(true);
                    }}
                    onDelete={(addr) => setDeletingAddress(addr)}
                    onAddNew={() => {
                      setEditingAddress(null);
                      setShowAddressForm(true);
                    }}
                    showActions
                  />
                )}
              </CardContent>
            </Card>

            {/* Order History Section */}
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowOrderHistory(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Histórico de pedidos</h3>
                      <p className="text-sm text-muted-foreground">
                        {establishmentName 
                          ? `Pedidos em ${establishmentName}` 
                          : 'Ver e repetir pedidos anteriores'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Logout Button */}
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Profile Dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar dados pessoais</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome completo</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input 
                value={formatPhone(customer?.whatsapp || '')} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O número de WhatsApp não pode ser alterado
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingProfile(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveProfile} 
                disabled={savingProfile}
                className="flex-1"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Form Dialog */}
      <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Editar endereço' : 'Novo endereço'}
            </DialogTitle>
          </DialogHeader>
          
          <CustomerAddressForm
            initialData={editingAddress ? {
              label: editingAddress.label,
              street: editingAddress.street,
              number: editingAddress.number,
              complement: editingAddress.complement || '',
              neighborhood: editingAddress.neighborhood || '',
              referencePoint: editingAddress.reference_point || '',
              isDefault: editingAddress.is_default,
            } : undefined}
            onSubmit={handleSaveAddress}
            onCancel={() => {
              setShowAddressForm(false);
              setEditingAddress(null);
            }}
            loading={savingAddress}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Address Confirmation */}
      <AlertDialog open={!!deletingAddress} onOpenChange={() => setDeletingAddress(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o endereço "{deletingAddress?.label}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order History */}
      <CustomerOrderHistory
        open={showOrderHistory}
        onOpenChange={setShowOrderHistory}
        customerId={customer?.id}
        establishmentId={establishmentId}
        establishmentName={establishmentName}
      />
    </>
  );
}
