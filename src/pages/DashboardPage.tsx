import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Store, 
  Menu as MenuIcon, 
  ShoppingBag, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Clock,
  AlertTriangle,
  Crown,
  X,
  Upload,
  Loader2,
  QrCode,
  Pencil,
  Check,
  Download,
  Printer,
  Settings2,
  Sparkles
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatCurrency } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEstablishment, ProductAddition } from '@/hooks/useEstablishment';
import { ImageUpload } from '@/components/ImageUpload';
import { OrderManagement } from '@/components/OrderManagement';
import { DeliverySettings } from '@/components/DeliverySettings';
import { DeliveryZones } from '@/components/DeliveryZones';
import { CouponManagement } from '@/components/CouponManagement';
import { BusinessHoursSettings } from '@/components/BusinessHoursSettings';
import { ProductOptionGroupsManager, ProductOptionGroup } from '@/components/ProductOptionGroupsManager';
import { HelpTooltip, ProductOptionsHelpContent } from '@/components/HelpTooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

export default function DashboardPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { 
    establishment, 
    categories, 
    products, 
    loading: dataLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    createAddition,
    deleteAddition,
    getProductAdditions,
    checkSlugAvailable,
    updateSlug,
  } = useEstablishment();

  // QR Code ref
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Modal states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slugModalOpen, setSlugModalOpen] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'settings'>('menu');
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Edit states
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ id: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    unit_type: 'unidade',
    is_promotional: false,
    original_price: '',
    promotional_price: '',
    max_quantity: '',
    subject_to_availability: false,
    allow_observations: true,
  });
  const [productAdditions, setProductAdditions] = useState<{ id: string; name: string; price: number; image_url?: string }[]>([]);
  const [newAddition, setNewAddition] = useState({ name: '', price: '', image: '' });
  const [productOptionGroups, setProductOptionGroups] = useState<ProductOptionGroup[]>([]);

  // Slug editing states
  const [newSlug, setNewSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const isPro = establishment?.plan_status === 'active';
  const relevantDate = isPro 
    ? (establishment as any)?.plan_expires_at 
    : establishment?.trial_end_date;
  const daysLeft = relevantDate 
    ? Math.ceil((new Date(relevantDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 7;

  const menuUrl = establishment 
    ? `${window.location.origin}/${(establishment as any).slug || establishment.id}`
    : '';

  // Initialize delivery fee from establishment data
  useEffect(() => {
    if (establishment) {
      setDeliveryFee((establishment as any).delivery_fee || 0);
    }
  }, [establishment]);

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: "Link copiado!",
      description: "O link do seu cardápio foi copiado.",
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Slug handlers
  const openSlugModal = () => {
    const currentSlug = (establishment as any)?.slug || '';
    setNewSlug(currentSlug);
    setSlugAvailable(null);
    setSlugModalOpen(true);
  };

  const validateSlugFormat = (slug: string): boolean => {
    if (slug.length < 3) return false;
    const regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    return regex.test(slug);
  };

  const handleSlugChange = async (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setNewSlug(normalized);
    setSlugAvailable(null);

    if (normalized.length >= 3 && validateSlugFormat(normalized)) {
      setIsCheckingSlug(true);
      try {
        const available = await checkSlugAvailable(normalized);
        setSlugAvailable(available);
      } catch (error) {
        console.error('Error checking slug:', error);
      } finally {
        setIsCheckingSlug(false);
      }
    }
  };

  const handleSaveSlug = async () => {
    if (!validateSlugFormat(newSlug) || !slugAvailable) return;

    setIsSaving(true);
    try {
      await updateSlug(newSlug);
      toast({
        title: "URL atualizada!",
        description: `Sua nova URL é: ${window.location.origin}/${newSlug}`,
      });
      setSlugModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a URL.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // QR Code handlers
  const downloadQRCode = (forPrint: boolean = false) => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const size = forPrint ? 1024 : 256;
    const printCanvas = document.createElement('canvas');
    printCanvas.width = size;
    printCanvas.height = size + 80; // Extra space for text
    const ctx = printCanvas.getContext('2d');
    
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

    // Draw QR code scaled
    ctx.drawImage(canvas, 0, 0, size, size);

    // Add establishment name below
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${forPrint ? 32 : 14}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(establishment?.name || '', size / 2, size + (forPrint ? 50 : 25));

    const url = printCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${(establishment as any)?.slug || 'cardapio'}-qrcode${forPrint ? '-impressao' : ''}.png`;
    link.href = url;
    link.click();

    toast({
      title: forPrint ? "QR Code para impressão baixado!" : "QR Code baixado!",
      description: "O arquivo foi salvo no seu dispositivo.",
    });
  };

  // Category handlers
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryModalOpen(true);
  };

  const openEditCategory = (category: { id: string; name: string }) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryName.trim());
        toast({
          title: "Categoria atualizada!",
          description: `A categoria "${categoryName}" foi atualizada.`,
        });
      } else {
        await createCategory(categoryName.trim());
        toast({
          title: "Categoria criada!",
          description: `A categoria "${categoryName}" foi criada.`,
        });
      }

      setCategoryModalOpen(false);
      setCategoryName('');
      setEditingCategory(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a categoria.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteCategory = (category: { id: string; name: string }) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setIsSaving(true);
    try {
      await deleteCategory(deletingCategory.id);
      toast({
        title: "Categoria excluída!",
        description: `A categoria "${deletingCategory.name}" e seus produtos foram removidos.`,
      });
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Product handlers
  const getDefaultProductForm = () => ({
    name: '',
    description: '',
    price: '',
    image: '',
    unit_type: 'unidade',
    is_promotional: false,
    original_price: '',
    promotional_price: '',
    max_quantity: '',
    subject_to_availability: false,
    allow_observations: true,
  });

  const openAddProduct = (categoryId: string) => {
    setEditingProduct(null);
    setSelectedCategoryId(categoryId);
    setProductForm(getDefaultProductForm());
    setProductAdditions([]);
    setProductOptionGroups([]);
    setProductModalOpen(true);
  };

  const openEditProduct = (product: any) => {
    setEditingProduct({ id: product.id });
    setSelectedCategoryId(product.category_id);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image: product.image_url || '',
      unit_type: product.unit_type || 'unidade',
      is_promotional: product.is_promotional || false,
      original_price: product.original_price?.toString() || '',
      promotional_price: product.promotional_price?.toString() || '',
      max_quantity: product.max_quantity?.toString() || '',
      subject_to_availability: product.subject_to_availability || false,
      allow_observations: product.allow_observations !== false,
    });
    const additions = getProductAdditions(product.id);
    setProductAdditions(additions);
    setProductOptionGroups([]); // Will be loaded by ProductOptionGroupsManager
    setProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(productForm.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erro",
        description: "O preço deve ser um número válido maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        price,
        image_url: productForm.image.trim() || null,
        unit_type: productForm.unit_type,
        is_promotional: productForm.is_promotional,
        original_price: productForm.is_promotional && productForm.original_price 
          ? parseFloat(productForm.original_price.replace(',', '.')) 
          : null,
        promotional_price: productForm.is_promotional && productForm.promotional_price 
          ? parseFloat(productForm.promotional_price.replace(',', '.')) 
          : null,
        max_quantity: productForm.max_quantity ? parseInt(productForm.max_quantity) : null,
        subject_to_availability: productForm.subject_to_availability,
        allow_observations: productForm.allow_observations,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        
        // Sincronizar adicionais
        const originalAdditions = getProductAdditions(editingProduct.id);
        const currentAdditionIds = productAdditions.map(a => a.id);
        
        // Deletar adicionais removidos
        for (const original of originalAdditions) {
          if (!currentAdditionIds.includes(original.id)) {
            await deleteAddition(original.id);
          }
        }
        
        // Criar novos adicionais (IDs temporários)
        for (const addition of productAdditions) {
          if (addition.id.startsWith('temp-')) {
            await createAddition({
              product_id: editingProduct.id,
              name: addition.name,
              price: addition.price,
              image_url: addition.image_url,
            });
          }
        }
        
        // Salvar grupos de opções
        await saveProductOptionGroups(editingProduct.id, productOptionGroups);
        
        toast({
          title: "Produto atualizado!",
          description: `O produto "${productForm.name}" foi atualizado.`,
        });
      } else {
        const newProduct = await createProduct({
          category_id: selectedCategoryId,
          ...productData,
        });

        // Create additions for new product
        if (newProduct) {
          for (const addition of productAdditions) {
            await createAddition({
              product_id: newProduct.id,
              name: addition.name,
              price: addition.price,
              image_url: addition.image_url,
            });
          }
          
          // Salvar grupos de opções para novo produto
          await saveProductOptionGroups(newProduct.id, productOptionGroups);
        }

        toast({
          title: "Produto criado!",
          description: `O produto "${productForm.name}" foi adicionado.`,
        });
      }

      setProductModalOpen(false);
      setProductForm(getDefaultProductForm());
      setProductAdditions([]);
      setProductOptionGroups([]);
      setEditingProduct(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save product option groups to database
  const saveProductOptionGroups = async (productId: string, groups: ProductOptionGroup[]) => {
    try {
      // 1. Fetch existing groups
      const { data: existingGroups } = await supabase
        .from('product_option_groups')
        .select('id')
        .eq('product_id', productId);

      const existingIds = existingGroups?.map(g => g.id) || [];
      const currentIds = groups.filter(g => !g.id.startsWith('temp-')).map(g => g.id);

      // 2. Delete removed groups
      const toDelete = existingIds.filter(id => !currentIds.includes(id));
      if (toDelete.length > 0) {
        // Delete options first (cascade might not work)
        await supabase.from('product_options').delete().in('option_group_id', toDelete);
        await supabase.from('product_option_groups').delete().in('id', toDelete);
      }

      // 3. Upsert groups and options
      for (const group of groups) {
        const isNewGroup = group.id.startsWith('temp-');

        const groupData = {
          product_id: productId,
          name: group.name,
          type: group.type,
          is_required: group.is_required,
          min_selections: group.min_selections,
          max_selections: group.max_selections,
          sort_order: group.sort_order,
        };

        let groupId = group.id;

        if (isNewGroup) {
          const { data, error } = await supabase
            .from('product_option_groups')
            .insert(groupData)
            .select('id')
            .single();
          if (error) throw error;
          groupId = data.id;
        } else {
          const { error } = await supabase
            .from('product_option_groups')
            .update(groupData)
            .eq('id', group.id);
          if (error) throw error;
        }

        // Handle options for this group
        if (groupId) {
          // Fetch existing options
          const { data: existingOptions } = await supabase
            .from('product_options')
            .select('id')
            .eq('option_group_id', isNewGroup ? groupId : group.id);

          const existingOptIds = existingOptions?.map(o => o.id) || [];
          const currentOptIds = group.options.filter(o => !o.id.startsWith('temp-')).map(o => o.id);

          // Delete removed options
          const optsToDelete = existingOptIds.filter(id => !currentOptIds.includes(id));
          if (optsToDelete.length > 0) {
            await supabase.from('product_options').delete().in('id', optsToDelete);
          }

          // Upsert options
          for (const option of group.options) {
            const isNewOption = option.id.startsWith('temp-');

            const optionData = {
              option_group_id: groupId,
              name: option.name,
              price: option.price,
              is_default: option.is_default,
              is_available: option.is_available,
              sort_order: option.sort_order,
            };

            if (isNewOption) {
              await supabase.from('product_options').insert(optionData);
            } else {
              await supabase.from('product_options').update(optionData).eq('id', option.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error saving option groups:', error);
      throw error;
    }
  };

  const toggleProductAvailability = async (productId: string, currentAvailability: boolean) => {
    if (togglingProductId) return; // Prevent multiple clicks
    setTogglingProductId(productId);
    try {
      await updateProduct(productId, { available: !currentAvailability });
      toast({
        title: !currentAvailability ? "Produto ativado!" : "Produto desativado!",
        description: `O produto agora está ${!currentAvailability ? 'disponível' : 'indisponível'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a disponibilidade.",
        variant: "destructive",
      });
    } finally {
      setTogglingProductId(null);
    }
  };

  // Addition handlers (local state for modal)
  const addLocalAddition = () => {
    if (!newAddition.name.trim()) return;
    
    const price = parseFloat(newAddition.price.replace(',', '.')) || 0;
    const addition = {
      id: `temp-${Date.now()}`,
      name: newAddition.name.trim(),
      price,
      image_url: newAddition.image || undefined,
    };
    
    setProductAdditions(prev => [...prev, addition]);
    setNewAddition({ name: '', price: '', image: '' });
  };

  const removeLocalAddition = (additionId: string) => {
    setProductAdditions(prev => prev.filter(a => a.id !== additionId));
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Estabelecimento não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Parece que você ainda não possui um estabelecimento cadastrado.
            </p>
            <Link to="/cadastro">
              <Button>Criar estabelecimento</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
              {establishment.logo_url ? (
                <img src={establishment.logo_url} alt={establishment.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="font-semibold text-foreground text-sm">{establishment.name}</h1>
              {establishment?.has_pro_plus ? (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Plano Pro+
                </Badge>
              ) : isPro ? (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-secondary/10 text-secondary border-secondary/20"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Plano Pro
                </Badge>
              ) : (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-accent text-accent-foreground border-primary/20"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Teste: {daysLeft} dias restantes
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Trial Warning Banner */}
      {!isPro && daysLeft <= 5 && (
        <div className="bg-warning/10 border-b border-warning/20 px-4 py-3">
          <div className="container flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Seu período de teste termina em {daysLeft} dias
              </span>
            </div>
            <Link to="/upgrade">
              <Button size="sm" variant="secondary">
                <Crown className="w-4 h-4 mr-1" />
                Ativar Pro
              </Button>
            </Link>
          </div>
        </div>
      )}

      <main className="container py-6">
        {/* Menu Link Card */}
        <Card className="mb-6 bg-gradient-hero text-primary-foreground">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium opacity-90 mb-1">Link do seu cardápio:</p>
                <p className="text-xs truncate opacity-75">{menuUrl}</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/20"
                  onClick={openSlugModal}
                  title="Editar URL"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/20"
                  onClick={copyLink}
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Link to={`/${(establishment as any).slug || establishment.id}`} target="_blank">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-primary-foreground hover:bg-white/20"
                    title="Abrir cardápio"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/20"
                  onClick={() => setQrCodeModalOpen(true)}
                  title="QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={activeTab === 'menu' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('menu')}
          >
            <MenuIcon className="w-4 h-4 mr-1" />
            Cardápio
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag className="w-4 h-4 mr-1" />
            Pedidos
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('settings')}
          >
            <Store className="w-4 h-4 mr-1" />
            Configurações
          </Button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <OrderManagement establishmentId={establishment.id} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <BusinessHoursSettings establishmentId={establishment.id} />
            <DeliverySettings
              establishmentId={establishment.id}
              currentFee={deliveryFee}
              onUpdate={setDeliveryFee}
            />
            <DeliveryZones establishmentId={establishment.id} />
            <CouponManagement establishmentId={establishment.id} />
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Categorias', value: categories.length },
                { label: 'Produtos', value: products.length },
                { label: 'Disponíveis', value: products.filter(p => p.available).length },
                { label: 'Taxa entrega', value: deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis' },
              ].map((stat, i) => (
                <Card key={i}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Categories and Products */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Seu Cardápio</h2>
                <Button size="sm" onClick={openAddCategory}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nova categoria
                </Button>
              </div>

              {categories.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MenuIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Você ainda não tem categorias. Crie sua primeira categoria para começar!
                    </p>
                    <Button onClick={openAddCategory}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar categoria
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                categories.map((category) => {
                  const categoryProducts = products.filter(p => p.category_id === category.id);
                  
                  return (
                    <Card key={category.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => openEditCategory(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => openDeleteCategory(category)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {categoryProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum produto nesta categoria ainda.
                            </p>
                          ) : (
                            categoryProducts.map((product) => (
                              <div 
                                key={product.id}
                                className={`flex items-center gap-4 p-3 rounded-xl bg-muted/50 ${
                                  !product.available ? 'opacity-60' : ''
                                }`}
                              >
                                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h4 className="font-medium text-foreground">{product.name}</h4>
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {product.description}
                                      </p>
                                    </div>
                                    <p className="font-semibold text-primary whitespace-nowrap">
                                      {formatCurrency(Number(product.price))}
                                    </p>
                                  </div>
                                  {getProductAdditions(product.id).length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {getProductAdditions(product.id).length} adicionais
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    title={product.available ? 'Desativar' : 'Ativar'}
                                    disabled={togglingProductId === product.id}
                                    onClick={() => toggleProductAvailability(product.id, product.available)}
                                  >
                                    {togglingProductId === product.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : product.available ? (
                                      <Eye className="w-4 h-4 text-secondary" />
                                    ) : (
                                      <EyeOff className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => openEditProduct(product)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => openAddProduct(category.id)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar produto
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar categoria' : 'Nova categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nome da categoria</Label>
              <Input
                id="categoryName"
                placeholder="Ex: Lanches, Bebidas, Sobremesas..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSaving && handleSaveCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingCategory ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Modal */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar produto' : 'Novo produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Product Image Upload */}
            <div className="space-y-2">
              <Label>Foto do produto (opcional)</Label>
              <div className="w-full h-32 overflow-hidden">
                <ImageUpload
                  value={productForm.image}
                  onChange={(url) => setProductForm(prev => ({ ...prev, image: url || '' }))}
                  folder="products"
                  className="w-full h-full"
                  onUploadStart={() => setIsImageUploading(true)}
                  onUploadEnd={() => setIsImageUploading(false)}
                  placeholder={
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Enviar foto do produto</span>
                    </>
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">Nome do produto *</Label>
              <Input
                id="productName"
                placeholder="Ex: X-Burguer, Suco Natural..."
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productDescription">Descrição</Label>
              <Textarea
                id="productDescription"
                placeholder="Descreva os ingredientes e detalhes do produto..."
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productPrice">Preço *</Label>
                <Input
                  id="productPrice"
                  placeholder="0,00"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productUnit">Unidade de venda</Label>
                <Select
                  value={productForm.unit_type}
                  onValueChange={(value) => setProductForm(prev => ({ ...prev, unit_type: value }))}
                >
                  <SelectTrigger id="productUnit">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="grama">Grama</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                    <SelectItem value="mililitro">Mililitro</SelectItem>
                    <SelectItem value="pacote">Pacote</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="saco">Saco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Promotional Product */}
            <div className="space-y-3 p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPromotional"
                  checked={productForm.is_promotional}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_promotional: !!checked }))}
                />
                <Label htmlFor="isPromotional" className="cursor-pointer">Produto em promoção</Label>
              </div>
              
              {productForm.is_promotional && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Preço original</Label>
                    <Input
                      id="originalPrice"
                      placeholder="0,00"
                      value={productForm.original_price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, original_price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promotionalPrice">Preço promocional</Label>
                    <Input
                      id="promotionalPrice"
                      placeholder="0,00"
                      value={productForm.promotional_price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, promotional_price: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <div className="space-y-3 p-3 border border-border rounded-lg">
              <Label className="text-sm font-medium">Opções avançadas</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="subjectToAvailability"
                  checked={productForm.subject_to_availability}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, subject_to_availability: !!checked }))}
                />
                <Label htmlFor="subjectToAvailability" className="cursor-pointer text-sm">Sujeito à disponibilidade</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowObservations"
                  checked={productForm.allow_observations}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, allow_observations: !!checked }))}
                />
                <Label htmlFor="allowObservations" className="cursor-pointer text-sm">Permitir observações do cliente</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxQuantity" className="text-sm">Limite por pedido (opcional)</Label>
                <Input
                  id="maxQuantity"
                  type="number"
                  placeholder="Sem limite"
                  value={productForm.max_quantity}
                  onChange={(e) => setProductForm(prev => ({ ...prev, max_quantity: e.target.value }))}
                  className="w-32"
                />
              </div>
            </div>

            {/* Additions */}
            <div className="space-y-2">
              <Label>Adicionais (opcional)</Label>
              {productAdditions.length > 0 && (
                <div className="space-y-2">
                  {productAdditions.map((addition) => (
                    <div 
                      key={addition.id} 
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {addition.image_url && (
                          <img src={addition.image_url} alt={addition.name} className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="text-sm">{addition.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-primary font-medium">
                          +{formatCurrency(addition.price)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => removeLocalAddition(addition.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* New Addition Form */}
              <div className="space-y-2 p-3 border border-dashed border-border rounded-lg">
                <div className="flex gap-2">
                  <div className="w-16 h-16">
                    <ImageUpload
                      value={newAddition.image}
                      onChange={(url) => setNewAddition(prev => ({ ...prev, image: url || '' }))}
                      folder="additions"
                      className="w-full h-full"
                      placeholder={<Upload className="w-4 h-4 text-muted-foreground" />}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Nome do adicional"
                      value={newAddition.name}
                      onChange={(e) => setNewAddition(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Preço"
                        value={newAddition.price}
                        onChange={(e) => setNewAddition(prev => ({ ...prev, price: e.target.value }))}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={addLocalAddition}
                        disabled={!newAddition.name.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Option Groups */}
            <Card className="border-dashed">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Personalização do Produto</CardTitle>
                  <HelpTooltip>
                    <ProductOptionsHelpContent />
                  </HelpTooltip>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure as opções que o cliente poderá escolher ao pedir este produto.
                </p>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <ProductOptionGroupsManager
                  productId={editingProduct?.id || `temp-${Date.now()}`}
                  establishment={establishment}
                  categoryName={categories.find(c => c.id === selectedCategoryId)?.name}
                  onGroupsChange={setProductOptionGroups}
                />
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModalOpen(false)} disabled={isSaving || isImageUploading}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={isSaving || isImageUploading}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isImageUploading ? 'Enviando imagem...' : editingProduct ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slug Edit Modal */}
      <Dialog open={slugModalOpen} onOpenChange={setSlugModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar URL do Cardápio</DialogTitle>
            <DialogDescription>
              Personalize a URL do seu cardápio para facilitar o compartilhamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {window.location.origin}/
                </span>
                <div className="relative flex-1">
                  <Input
                    placeholder="meu-restaurante"
                    value={newSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="pr-8"
                  />
                  {isCheckingSlug && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!isCheckingSlug && slugAvailable === true && newSlug.length >= 3 && (
                    <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                  {!isCheckingSlug && slugAvailable === false && (
                    <X className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
              {slugAvailable === true && newSlug.length >= 3 && (
                <p className="text-xs text-green-500">✓ URL disponível</p>
              )}
              {slugAvailable === false && (
                <p className="text-xs text-destructive">✗ Esta URL já está em uso</p>
              )}
              {newSlug.length > 0 && newSlug.length < 3 && (
                <p className="text-xs text-muted-foreground">Mínimo 3 caracteres</p>
              )}
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                • Use apenas letras minúsculas, números e hífens<br />
                • Mínimo 3 caracteres<br />
                • Não pode começar ou terminar com hífen
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlugModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSlug} 
              disabled={isSaving || !slugAvailable || newSlug.length < 3}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code do Cardápio</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeCanvas
                id="qr-canvas"
                value={menuUrl}
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={establishment?.logo_url ? {
                  src: establishment.logo_url,
                  height: 40,
                  width: 40,
                  excavate: true,
                } : undefined}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{establishment?.name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[250px]">{menuUrl}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => downloadQRCode(false)}
              >
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
              <Button 
                className="flex-1"
                onClick={() => downloadQRCode(true)}
              >
                <Printer className="w-4 h-4 mr-2" />
                Impressão
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Use o QR Code em mesas, cardápios físicos e materiais promocionais
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deletingCategory?.name}"? 
              Todos os produtos desta categoria também serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
