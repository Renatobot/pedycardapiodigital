import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  LogOut, 
  Loader2, 
  Phone,
  TrendingUp,
  DollarSign,
  Calendar,
  ExternalLink,
  UserPlus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useResellerDashboard } from '@/hooks/useResellerDashboard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import pedyLogo from '@/assets/logo_pedy.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ResellerDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const {
    reseller,
    clients,
    commissions,
    stats,
    loading,
    error,
    fetchResellerData,
    getReferralLink,
    getClientStatus,
    getDaysRemaining,
  } = useResellerDashboard();

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin/login');
        return;
      }

      // Check if user is a reseller
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'reseller')
        .maybeSingle();

      if (!roleData) {
        toast({
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar este painel.',
          variant: 'destructive',
        });
        navigate('/admin/login');
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const link = getReferralLink();
    const message = encodeURIComponent(
      `Olá! Conheça o PEDY - Cardápio Digital para seu negócio:\n\n${link}\n\nCrie seu cardápio em 5 minutos e receba pedidos organizados no WhatsApp!`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleaned}`, '_blank');
  };

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !reseller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Erro de Acesso</h2>
            <p className="text-muted-foreground mb-4">{error || 'Não foi possível carregar seus dados.'}</p>
            <Button onClick={() => navigate('/admin/login')}>
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={pedyLogo} alt="PEDY" className="h-10 object-contain" />
            <div className="hidden md:block">
              <p className="text-sm font-medium">Painel do Revendedor</p>
              <p className="text-xs text-muted-foreground">Olá, {reseller.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchResellerData()}
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">Atualizar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1 text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Referral Link Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Seu Link de Indicação</CardTitle>
            </div>
            <CardDescription>
              {reseller.pricing_mode === 'commission' 
                ? 'Quando um cliente usar seu link, ele será cadastrado automaticamente e vinculado a você.'
                : 'Quando um cliente acessar seu link, ele verá a página de vendas e será direcionado para seu WhatsApp.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input 
                readOnly 
                value={getReferralLink()} 
                className="flex-1 bg-background font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={copyReferralLink}
                  className="gap-1"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
                <Button onClick={shareWhatsApp} className="gap-1">
                  <ExternalLink className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Código de indicação: <span className="font-mono font-semibold text-primary">{reseller.referral_code}</span>
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Clientes</p>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter value={stats.totalClients} />
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    <AnimatedCounter value={stats.activeClients} />
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Inativos</p>
                  <p className="text-2xl font-bold text-red-600">
                    <AnimatedCounter value={stats.inactiveClients} />
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          {reseller.pricing_mode === 'commission' && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Comissão Pendente</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(stats.pendingCommission)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-amber-200" />
                </div>
              </CardContent>
            </Card>
          )}

          {reseller.pricing_mode === 'custom_price' && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Seu Preço Pro</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(reseller.price_pro)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients" className="gap-1">
              <Users className="w-4 h-4" />
              Seus Clientes
            </TabsTrigger>
            {reseller.pricing_mode === 'commission' && (
              <TabsTrigger value="commissions" className="gap-1">
                <DollarSign className="w-4 h-4" />
                Comissões
              </TabsTrigger>
            )}
            {reseller.pricing_mode === 'custom_price' && (
              <TabsTrigger value="prices" className="gap-1">
                <DollarSign className="w-4 h-4" />
                Seus Preços
              </TabsTrigger>
            )}
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seus Clientes</CardTitle>
                <CardDescription>
                  Lista de estabelecimentos cadastrados através do seu link de indicação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compartilhe seu link de indicação para começar!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Dias Restantes</TableHead>
                          <TableHead>Cadastro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => {
                          const statusInfo = getClientStatus(client);
                          const daysRemaining = getDaysRemaining(client);
                          
                          return (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openWhatsApp(client.whatsapp)}
                                  className="gap-1 h-auto py-1 px-2"
                                >
                                  <Phone className="w-3 h-3" />
                                  {formatPhone(client.whatsapp)}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {client.plan_type || (client.plan_status === 'trial' ? 'Trial' : 'Básico')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusInfo.color}>
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {daysRemaining !== null && daysRemaining > 0 ? (
                                  <span className="text-sm">{daysRemaining} dias</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(client.created_at), 'dd/MM/yy', { locale: ptBR })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab (Commission Mode) */}
          {reseller.pricing_mode === 'commission' && (
            <TabsContent value="commissions">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Suas Comissões</CardTitle>
                      <CardDescription>
                        Histórico de comissões por ativações de planos
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Comissão</p>
                      <p className="text-lg font-bold text-primary">{reseller.commission_percentage}%</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Monthly Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Este mês</p>
                      <p className="text-lg font-semibold">{stats.thisMonthActivations} ativações</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Comissão do mês</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.thisMonthCommission)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pendente</p>
                      <p className="text-lg font-semibold text-amber-600">{formatCurrency(stats.pendingCommission)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Já recebido</p>
                      <p className="text-lg font-semibold text-muted-foreground">{formatCurrency(stats.paidCommission)}</p>
                    </div>
                  </div>

                  {commissions.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma comissão registrada ainda.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estabelecimento</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Dias</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Comissão</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissions.map((commission) => (
                            <TableRow key={commission.id}>
                              <TableCell className="font-medium">{commission.establishment_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{commission.plan_type}</Badge>
                              </TableCell>
                              <TableCell>{commission.days_activated} dias</TableCell>
                              <TableCell>{formatCurrency(commission.plan_price)}</TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {formatCurrency(commission.commission_value)}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={commission.commission_status === 'paid' ? 'default' : 'secondary'}
                                  className={commission.commission_status === 'pending' 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                                    : ''
                                  }
                                >
                                  {commission.commission_status === 'paid' ? 'Pago' : 'Pendente'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(commission.activated_at), 'dd/MM/yy', { locale: ptBR })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Prices Tab (Custom Price Mode) */}
          {reseller.pricing_mode === 'custom_price' && (
            <TabsContent value="prices">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seus Preços de Revenda</CardTitle>
                  <CardDescription>
                    Valores que você pode cobrar dos seus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Plano Básico</p>
                      <p className="text-2xl font-bold">{formatCurrency(reseller.price_basic)}</p>
                      <p className="text-xs text-muted-foreground mt-1">por mês</p>
                    </div>
                    <div className="p-4 border rounded-lg border-primary/50 bg-primary/5">
                      <p className="text-sm text-muted-foreground mb-1">Plano Pro</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(reseller.price_pro)}</p>
                      <p className="text-xs text-muted-foreground mt-1">por mês</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Plano Pro+</p>
                      <p className="text-2xl font-bold">{formatCurrency(reseller.price_pro_plus)}</p>
                      <p className="text-xs text-muted-foreground mt-1">por mês</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Dica:</strong> Estes são os valores que você pode cobrar dos seus clientes. 
                      O lucro é a diferença entre o que você cobra e o valor mínimo da plataforma.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Mode Info */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                reseller.pricing_mode === 'commission' 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <DollarSign className={`w-5 h-5 ${
                  reseller.pricing_mode === 'commission' 
                    ? 'text-green-600' 
                    : 'text-blue-600'
                }`} />
              </div>
              <div>
                <p className="font-medium">
                  Modo: {reseller.pricing_mode === 'commission' ? 'Comissão' : 'Preço Próprio'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reseller.pricing_mode === 'commission' 
                    ? `Você recebe ${reseller.commission_percentage}% de comissão por cada ativação de plano dos seus clientes.`
                    : 'Você define seus próprios preços e lucra com a diferença para o preço mínimo da plataforma.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
