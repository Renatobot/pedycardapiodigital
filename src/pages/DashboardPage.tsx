import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Settings, 
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
  X
} from 'lucide-react';
import { mockEstablishment, mockCategories, mockProducts } from '@/lib/mockData';
import { formatCurrency } from '@/lib/whatsapp';
import { Category, Product, ProductAddition } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { toast } = useToast();
  const establishment = mockEstablishment;

  // State for categories and products
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [products, setProducts] = useState<Product[]>(mockProducts);

  // Modal states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
  });
  const [productAdditions, setProductAdditions] = useState<ProductAddition[]>([]);
  const [newAddition, setNewAddition] = useState({ name: '', price: '' });

  const daysLeft = Math.ceil(
    (establishment.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const menuUrl = `${window.location.origin}/cardapio/${establishment.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: "Link copiado!",
      description: "O link do seu cardápio foi copiado.",
    });
  };

  // Category handlers
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryModalOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      setCategories(prev =>
        prev.map(c =>
          c.id === editingCategory.id ? { ...c, name: categoryName.trim() } : c
        )
      );
      toast({
        title: "Categoria atualizada!",
        description: `A categoria "${categoryName}" foi atualizada.`,
      });
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        establishmentId: establishment.id,
        name: categoryName.trim(),
        order: categories.length + 1,
      };
      setCategories(prev => [...prev, newCategory]);
      toast({
        title: "Categoria criada!",
        description: `A categoria "${categoryName}" foi criada.`,
      });
    }

    setCategoryModalOpen(false);
    setCategoryName('');
    setEditingCategory(null);
  };

  const openDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;

    // Remove category and its products
    setCategories(prev => prev.filter(c => c.id !== deletingCategory.id));
    setProducts(prev => prev.filter(p => p.categoryId !== deletingCategory.id));
    
    toast({
      title: "Categoria excluída!",
      description: `A categoria "${deletingCategory.name}" e seus produtos foram removidos.`,
    });

    setDeleteDialogOpen(false);
    setDeletingCategory(null);
  };

  // Product handlers
  const openAddProduct = (categoryId: string) => {
    setEditingProduct(null);
    setSelectedCategoryId(categoryId);
    setProductForm({ name: '', description: '', price: '', image: '' });
    setProductAdditions([]);
    setProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setSelectedCategoryId(product.categoryId);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image || '',
    });
    setProductAdditions([...product.additions]);
    setProductModalOpen(true);
  };

  const handleSaveProduct = () => {
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

    if (editingProduct) {
      setProducts(prev =>
        prev.map(p =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: productForm.name.trim(),
                description: productForm.description.trim(),
                price,
                image: productForm.image.trim() || undefined,
                additions: productAdditions,
              }
            : p
        )
      );
      toast({
        title: "Produto atualizado!",
        description: `O produto "${productForm.name}" foi atualizado.`,
      });
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        categoryId: selectedCategoryId,
        establishmentId: establishment.id,
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price,
        image: productForm.image.trim() || undefined,
        additions: productAdditions,
        available: true,
      };
      setProducts(prev => [...prev, newProduct]);
      toast({
        title: "Produto criado!",
        description: `O produto "${productForm.name}" foi adicionado.`,
      });
    }

    setProductModalOpen(false);
    setProductForm({ name: '', description: '', price: '', image: '' });
    setProductAdditions([]);
    setEditingProduct(null);
  };

  const toggleProductAvailability = (productId: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const newAvailability = !p.available;
          toast({
            title: newAvailability ? "Produto ativado!" : "Produto desativado!",
            description: `O produto "${p.name}" agora está ${newAvailability ? 'disponível' : 'indisponível'}.`,
          });
          return { ...p, available: newAvailability };
        }
        return p;
      })
    );
  };

  // Addition handlers
  const addAddition = () => {
    if (!newAddition.name.trim()) return;
    
    const price = parseFloat(newAddition.price.replace(',', '.')) || 0;
    const addition: ProductAddition = {
      id: Date.now().toString(),
      name: newAddition.name.trim(),
      price,
    };
    
    setProductAdditions(prev => [...prev, addition]);
    setNewAddition({ name: '', price: '' });
  };

  const removeAddition = (additionId: string) => {
    setProductAdditions(prev => prev.filter(a => a.id !== additionId));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
              <Store className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground text-sm">{establishment.name}</h1>
              <Badge 
                variant="outline" 
                className="text-xs bg-accent text-accent-foreground border-primary/20"
              >
                <Clock className="w-3 h-3 mr-1" />
                Teste: {daysLeft} dias restantes
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <LogOut className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Trial Warning Banner */}
      {daysLeft <= 5 && (
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
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/20"
                  onClick={copyLink}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Link to={`/cardapio/${establishment.id}`} target="_blank">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-primary-foreground hover:bg-white/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Categorias', value: categories.length },
            { label: 'Produtos', value: products.length },
            { label: 'Disponíveis', value: products.filter(p => p.available).length },
            { label: 'Pedidos hoje', value: 0 },
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
              const categoryProducts = products.filter(p => p.categoryId === category.id);
              
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
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
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
                                  {formatCurrency(product.price)}
                                </p>
                              </div>
                              {product.additions.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {product.additions.length} adicionais
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                title={product.available ? 'Desativar' : 'Ativar'}
                                onClick={() => toggleProductAvailability(product.id)}
                              >
                                {product.available ? (
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
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
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
              <Label htmlFor="productImage">URL da imagem (opcional)</Label>
              <Input
                id="productImage"
                placeholder="https://exemplo.com/imagem.jpg"
                value={productForm.image}
                onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
              />
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
                      <span className="text-sm">{addition.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-primary font-medium">
                          +{formatCurrency(addition.price)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => removeAddition(addition.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={addAddition}
                  disabled={!newAddition.name.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
