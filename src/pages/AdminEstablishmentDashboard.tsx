import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  ArrowLeft,
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
  Sparkles,
  Shield
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatCurrency } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { useAdminEstablishment, ProductAddition } from '@/hooks/useAdminEstablishment';
import { ImageUpload } from '@/components/ImageUpload';
import { OrderManagement } from '@/components/OrderManagement';
import { DeliverySettings } from '@/components/DeliverySettings';
import { DeliveryZones } from '@/components/DeliveryZones';
import { CouponManagement } from '@/components/CouponManagement';
import { BusinessHoursSettings } from '@/components/BusinessHoursSettings';
import { NotificationSettings } from '@/components/NotificationSettings';
import { EstablishmentAddressSettings } from '@/components/EstablishmentAddressSettings';
import { ProductOptionGroupsManager, ProductOptionGroup } from '@/components/ProductOptionGroupsManager';
import { HelpTooltip, ProductOptionsHelpContent } from '@/components/HelpTooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { MenuAppearanceSettings } from '@/components/MenuAppearanceSettings';

export default function AdminEstablishmentDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { establishmentId } = useParams<{ establishmentId: string }>();
  
  const { 
    establishment, 
    categories, 
    products, 
    loading: dataLoading,
    isAdmin,
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
    refetch,
  } = useAdminEstablishment(establishmentId || null);

  // QR Code ref
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!dataLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/admin/dashboard');
    }
  }, [isAdmin, dataLoading, navigate]);

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
    ? establishment?.plan_expires_at 
    : establishment?.trial_end_date;
  const daysLeft = relevantDate 
    ? Math.ceil((new Date(relevantDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 7;

  const menuUrl = establishment 
    ? `${window.location.origin}/${establishment.slug || establishment.id}`
    : '';

  // Initialize delivery fee from establishment data
  useEffect(() => {
    if (establishment) {
      setDeliveryFee(establishment.delivery_fee || 0);
    }
  }, [establishment]);

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: "Link copiado!",
      description: "O link do cardápio foi copiado.",
    });
  };

  const handleBackToAdmin = () => {
    navigate('/admin/dashboard');
  };

  // Slug handlers
  const openSlugModal = () => {
    const currentSlug = establishment?.slug || '';
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
        description: `Nova URL: ${window.location.origin}/${newSlug}`,
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
    printCanvas.height = size + 80;
    const ctx = printCanvas.getContext('2d');
    
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);
    ctx.drawImage(canvas, 0, 0, size, size);

    ctx.fillStyle = '#000000';
    ctx.font = `bold ${forPrint ? 32 : 14}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(establishment?.name || '', size / 2, size + (forPrint ? 50 : 25));

    const url = printCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${establishment?.slug || 'cardapio'}-qrcode${forPrint ? '-impressao' : ''}.png`;
    link.href = url;
    link.click();

    toast({
      title: forPrint ? "QR Code para impressão baixado!" : "QR Code baixado!",
      description: "O arquivo foi salvo.",
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
    setProductOptionGroups([]);
    setProductModalOpen(true);
  };

  // Save product option groups function
  const saveProductOptionGroups = async (productId: string, groups: ProductOptionGroup[]) => {
    // Fetch existing groups
    const { data: existingGroups } = await supabase
      .from('product_option_groups')
      .select('id')
      .eq('product_id', productId);

    const existingIds = existingGroups?.map(g => g.id) || [];
    const currentIds = groups.filter(g => !g.id.startsWith('temp-')).map(g => g.id);

    // Delete removed groups
    for (const id of existingIds) {
      if (!currentIds.includes(id)) {
        await supabase.from('product_option_groups').delete().eq('id', id);
      }
    }

    // Create/update groups
    for (const group of groups) {
      if (group.id.startsWith('temp-')) {
        // Create new group
        const { data: newGroup } = await supabase
          .from('product_option_groups')
          .insert({
            product_id: productId,
            name: group.name,
            type: group.type,
            is_required: group.is_required,
            min_selections: group.min_selections,
            max_selections: group.max_selections,
            sort_order: group.sort_order,
          })
          .select()
          .single();

        if (newGroup) {
          // Create options for new group
          for (const option of group.options) {
            await supabase.from('product_options').insert({
              option_group_id: newGroup.id,
              name: option.name,
              price: option.price,
              is_default: option.is_default,
              is_available: option.is_available,
              sort_order: option.sort_order,
            });
          }
        }
      } else {
        // Update existing group
        await supabase
          .from('product_option_groups')
          .update({
            name: group.name,
            type: group.type,
            is_required: group.is_required,
            min_selections: group.min_selections,
            max_selections: group.max_selections,
            sort_order: group.sort_order,
          })
          .eq('id', group.id);

        // Handle options sync
        const { data: existingOptions } = await supabase
          .from('product_options')
          .select('id')
          .eq('option_group_id', group.id);

        const existingOptionIds = existingOptions?.map(o => o.id) || [];
        const currentOptionIds = group.options.filter(o => !o.id.startsWith('temp-')).map(o => o.id);

        // Delete removed options
        for (const id of existingOptionIds) {
          if (!currentOptionIds.includes(id)) {
            await supabase.from('product_options').delete().eq('id', id);
          }
        }

        // Create/update options
        for (const option of group.options) {
          if (option.id.startsWith('temp-')) {
            await supabase.from('product_options').insert({
              option_group_id: group.id,
              name: option.name,
              price: option.price,
              is_default: option.is_default,
              is_available: option.is_available,
              sort_order: option.sort_order,
            });
          } else {
            await supabase
              .from('product_options')
              .update({
                name: option.name,
                price: option.price,
                is_default: option.is_default,
                is_available: option.is_available,
                sort_order: option.sort_order,
              })
              .eq('id', option.id);
          }
        }
      }
    }
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
        
        // Sync additions
        const originalAdditions = getProductAdditions(editingProduct.id);
        const currentAdditionIds = productAdditions.map(a => a.id);
        
        for (const original of originalAdditions) {
          if (!currentAdditionIds.includes(original.id)) {
            await deleteAddition(original.id);
          }
        }
        
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

        if (newProduct) {
          for (const addition of productAdditions) {
            await createAddition({
              product_id: newProduct.id,
              name: addition.name,
              price: addition.price,
              image_url: addition.image_url,
            });
          }
          
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

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast({
        title: "Produto excluído!",
        description: "O produto foi removido do cardápio.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      });
    }
  };

  const handleToggleProductAvailability = async (product: any) => {
    setTogglingProductId(product.id);
    try {
      await updateProduct(product.id, { available: !product.available });
      toast({
        title: product.available ? "Produto indisponível" : "Produto disponível",
        description: `"${product.name}" foi ${product.available ? 'desativado' : 'ativado'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao alterar disponibilidade.",
        variant: "destructive",
      });
    } finally {
      setTogglingProductId(null);
    }
  };

  // Addition handlers
  const handleAddAddition = () => {
    if (!newAddition.name.trim() || !newAddition.price) return;
    
    const price = parseFloat(newAddition.price.replace(',', '.'));
    if (isNaN(price) || price < 0) return;

    setProductAdditions(prev => [...prev, {
      id: `temp-${Date.now()}`,
      name: newAddition.name.trim(),
      price,
      image_url: newAddition.image || undefined,
    }]);
    setNewAddition({ name: '', price: '', image: '' });
  };

  const handleRemoveAddition = (id: string) => {
    setProductAdditions(prev => prev.filter(a => a.id !== id));
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Estabelecimento não encontrado.</p>
        <Button onClick={handleBackToAdmin}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Painel
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Mode Banner */}
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
        <Shield className="w-4 h-4" />
        MODO ADMINISTRADOR - Gerenciando: {establishment.name}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToAdmin}
          className="ml-4 text-white hover:bg-red-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar ao Painel Master
        </Button>
      </div>

      {/* Header */}
      <header className="bg-card shadow-sm border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold">{establishment.name}</h1>
                <div className="flex items-center gap-2">
                  {isPro ? (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Plano Pro
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Trial - {daysLeft} dias
                    </Badge>
                  )}
                  {establishment.has_pro_plus && (
                    <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Pro+
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu URL and QR */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Link do cardápio:</p>
              <p className="text-sm font-medium truncate">{menuUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={openSlugModal}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setQrCodeModalOpen(true)}>
                <QrCode className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b pb-2 mb-4">
          <Button
            variant={activeTab === 'menu' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('menu')}
          >
            <MenuIcon className="w-4 h-4 mr-2" />
            Cardápio
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Pedidos
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('settings')}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Add Category Button */}
            <Button onClick={openAddCategory} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>

            {/* Categories and Products */}
            {categories.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MenuIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma categoria ainda.</p>
                  <p className="text-sm">Crie sua primeira categoria para começar!</p>
                </CardContent>
              </Card>
            ) : (
              categories.map(category => (
                <Card key={category.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteCategory(category)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {products
                      .filter(p => p.category_id === category.id)
                      .map(product => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Store className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{product.name}</p>
                              {!product.available && (
                                <Badge variant="outline" className="text-xs">
                                  Indisponível
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {product.description || 'Sem descrição'}
                            </p>
                            <p className="text-sm font-medium text-primary">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleProductAvailability(product)}
                              disabled={togglingProductId === product.id}
                            >
                              {togglingProductId === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : product.available ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openAddProduct(category.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && establishment && (
          <OrderManagement establishmentId={establishment.id} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && establishment && (
          <div className="space-y-6">
            <DeliverySettings establishmentId={establishment.id} />
            <DeliveryZones establishmentId={establishment.id} />
            <CouponManagement establishmentId={establishment.id} />
            <BusinessHoursSettings establishmentId={establishment.id} />
            <EstablishmentAddressSettings establishmentId={establishment.id} />
            <NotificationSettings establishmentId={establishment.id} />
            <MenuAppearanceSettings establishmentId={establishment.id} />
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nome da Categoria</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ex: Pizzas, Bebidas, Sobremesas..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deletingCategory?.name}"? 
              Todos os produtos desta categoria também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Modal */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Produto *</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pizza Margherita"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço *</Label>
                <Input
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o produto..."
                rows={2}
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Foto do Produto</Label>
              <div className="h-32 overflow-hidden rounded-lg">
                <ImageUpload
                  currentImage={productForm.image}
                  onImageChange={(url) => setProductForm(prev => ({ ...prev, image: url || '' }))}
                  onUploadStart={() => setIsImageUploading(true)}
                  onUploadEnd={() => setIsImageUploading(false)}
                  folder="products"
                />
              </div>
            </div>

            {/* Unit Type */}
            <div className="space-y-2">
              <Label>Unidade de Medida</Label>
              <Select
                value={productForm.unit_type}
                onValueChange={(value) => setProductForm(prev => ({ ...prev, unit_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Unidade</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="grama">Grama</SelectItem>
                  <SelectItem value="litro">Litro</SelectItem>
                  <SelectItem value="pacote">Pacote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Promotional */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_promotional"
                checked={productForm.is_promotional}
                onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_promotional: !!checked }))}
              />
              <Label htmlFor="is_promotional">Produto em promoção</Label>
            </div>

            {productForm.is_promotional && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label>Preço Original</Label>
                  <Input
                    value={productForm.original_price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, original_price: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Promocional</Label>
                  <Input
                    value={productForm.promotional_price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, promotional_price: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
              </div>
            )}

            {/* Max Quantity */}
            <div className="space-y-2">
              <Label>Limite por pedido (opcional)</Label>
              <Input
                type="number"
                value={productForm.max_quantity}
                onChange={(e) => setProductForm(prev => ({ ...prev, max_quantity: e.target.value }))}
                placeholder="Sem limite"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="subject_to_availability"
                  checked={productForm.subject_to_availability}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, subject_to_availability: !!checked }))}
                />
                <Label htmlFor="subject_to_availability">Sujeito à disponibilidade</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allow_observations"
                  checked={productForm.allow_observations}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, allow_observations: !!checked }))}
                />
                <Label htmlFor="allow_observations">Permitir observações do cliente</Label>
              </div>
            </div>

            {/* Additions */}
            <div className="space-y-2">
              <Label>Adicionais</Label>
              <div className="space-y-2">
                {productAdditions.map((addition) => (
                  <div key={addition.id} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{addition.name}</span>
                    <span className="text-sm text-muted-foreground">
                      +{formatCurrency(addition.price)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveAddition(addition.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do adicional"
                    value={newAddition.name}
                    onChange={(e) => setNewAddition(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Preço"
                    value={newAddition.price}
                    onChange={(e) => setNewAddition(prev => ({ ...prev, price: e.target.value }))}
                    className="w-24"
                  />
                  <Button size="sm" onClick={handleAddAddition}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Option Groups */}
            {editingProduct && (
              <ProductOptionGroupsManager
                productId={editingProduct.id}
                categoryName={categories.find(c => c.id === selectedCategoryId)?.name || ''}
                hasProPlus={establishment.has_pro_plus || false}
                isInTrial={establishment.plan_status === 'trial'}
                onGroupsChange={setProductOptionGroups}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={isSaving || isImageUploading}>
              {(isSaving || isImageUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isImageUploading ? 'Enviando imagem...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slug Modal */}
      <Dialog open={slugModalOpen} onOpenChange={setSlugModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar URL do Cardápio</DialogTitle>
            <DialogDescription>
              Personalize a URL do seu cardápio para facilitar o acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL personalizada</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {window.location.origin}/
                </span>
                <Input
                  value={newSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="meu-restaurante"
                  className="flex-1"
                />
              </div>
              {isCheckingSlug && (
                <p className="text-sm text-muted-foreground">Verificando disponibilidade...</p>
              )}
              {slugAvailable === true && newSlug.length >= 3 && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> URL disponível!
                </p>
              )}
              {slugAvailable === false && (
                <p className="text-sm text-destructive">URL já está em uso</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlugModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSlug} 
              disabled={isSaving || !slugAvailable || newSlug.length < 3}
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code do Cardápio</DialogTitle>
            <DialogDescription>
              Escaneie para acessar o cardápio ou baixe para impressão.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeCanvas
                id="qr-canvas"
                value={menuUrl}
                size={200}
                level="H"
              />
            </div>
            <p className="text-center text-sm font-medium">{establishment.name}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => downloadQRCode(false)}>
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
              <Button variant="outline" onClick={() => downloadQRCode(true)}>
                <Printer className="w-4 h-4 mr-2" />
                Para Impressão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
