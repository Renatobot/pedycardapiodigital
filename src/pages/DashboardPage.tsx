import { useState } from 'react';
import { Link } from 'react-router-dom';
import pedyLogo from '@/assets/logo_pedy.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Clock,
  AlertTriangle,
  Crown,
  ChevronRight
} from 'lucide-react';
import { mockEstablishment, mockCategories, mockProducts } from '@/lib/mockData';
import { formatCurrency } from '@/lib/whatsapp';

const menuItems = [
  { icon: MenuIcon, label: 'Cardápio', active: true },
  { icon: ShoppingBag, label: 'Pedidos', active: false },
  { icon: Settings, label: 'Configurações', active: false },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('cardapio');
  const establishment = mockEstablishment;
  const categories = mockCategories;
  const products = mockProducts;

  const daysLeft = Math.ceil(
    (establishment.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const menuUrl = `${window.location.origin}/cardapio/${establishment.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
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
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova categoria
            </Button>
          </div>

          {categories.map((category) => {
            const categoryProducts = products.filter(p => p.categoryId === category.id);
            
            return (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryProducts.map((product) => (
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
                          >
                            {product.available ? (
                              <Eye className="w-4 h-4 text-secondary" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar produto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
