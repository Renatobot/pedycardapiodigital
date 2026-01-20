import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Shield,
  LogOut,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Play,
  Pause,
  Calendar,
  Building2,
  Users,
  UserPlus,
  Trash2,
  Loader2,
  Key,
  Settings,
  Sparkles,
  Crown,
  Menu,
  MoreVertical,
  ExternalLink,
  ChartLine,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FEATURE_LABELS, PRO_PLUS_FEATURES } from '@/lib/featureGating';
import { AdminStatsCard } from '@/components/AdminStatsCard';
import { AdminDashboardSkeleton } from '@/components/AdminDashboardSkeleton';
import { AdminCharts } from '@/components/AdminCharts';
import { AdminQuickActions } from '@/components/AdminQuickActions';
import { AdminReports } from '@/components/AdminReports';
import { ResellerManagement } from '@/components/ResellerManagement';
import { AdminNotifications } from '@/components/AdminNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import logoPedy from '@/assets/logo_pedy.png';

interface Establishment {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cpf_cnpj: string;
  pix_key: string | null;
  logo_url: string | null;
  slug: string | null;
  plan_status: string;
  plan_type: string | null;
  plan_expires_at: string | null;
  trial_start_date: string;
  trial_end_date: string;
  created_at: string;
  has_pro_plus: boolean;
  pro_plus_activated_at: string | null;
}

interface Admin {
  user_id: string;
  email: string;
  created_at: string;
  is_current_user: boolean;
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'extend'>('activate');
  const [customDays, setCustomDays] = useState<number>(30);
  const [selectedPlanType, setSelectedPlanType] = useState<'basic' | 'pro' | 'pro_plus'>('pro');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  
  // Plan management state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planUpdateLoading, setPlanUpdateLoading] = useState(false);
  
  // Admin management state
  const [activeTab, setActiveTab] = useState('establishments');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [removeAdminModalOpen, setRemoveAdminModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [removeAdminLoading, setRemoveAdminLoading] = useState(false);
  
  // Password change state
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);


  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/admin/login');
          return;
        }

        setAdminEmail(user.email || '');

        // Verificar se tem role de admin
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError || !roleData) {
          await supabase.auth.signOut();
          navigate('/admin/login');
          return;
        }

        // Se é admin, buscar estabelecimentos
        await fetchEstablishments();
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        navigate('/admin/login');
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const fetchEstablishments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEstablishments(data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os estabelecimentos.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: { action: 'list' },
      });

      if (error) throw error;
      setAdmins(data?.admins || []);
    } catch (error) {
      console.error('Erro ao buscar administradores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os administradores.',
        variant: 'destructive',
      });
    }
    setAdminsLoading(false);
  };

  // Fetch admins when tab changes to 'admins'
  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha email e senha.',
        variant: 'destructive',
      });
      return;
    }

    if (newAdminPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setCreateAdminLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: { 
          action: 'create',
          email: newAdminEmail,
          password: newAdminPassword,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Sucesso!',
        description: `Administrador ${newAdminEmail} criado com sucesso.`,
      });

      setNewAdminEmail('');
      setNewAdminPassword('');
      setAddAdminModalOpen(false);
      await fetchAdmins();
    } catch (error: any) {
      console.error('Erro ao criar admin:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o administrador.',
        variant: 'destructive',
      });
    }
    setCreateAdminLoading(false);
  };

  const handleRemoveAdmin = async () => {
    if (!selectedAdmin) return;

    setRemoveAdminLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: { 
          action: 'remove',
          user_id: selectedAdmin.user_id,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Sucesso!',
        description: `Administrador ${selectedAdmin.email} removido.`,
      });

      setRemoveAdminModalOpen(false);
      setSelectedAdmin(null);
      await fetchAdmins();
    } catch (error: any) {
      console.error('Erro ao remover admin:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o administrador.',
        variant: 'destructive',
      });
    }
    setRemoveAdminLoading(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não conferem.',
        variant: 'destructive',
      });
      return;
    }

    setChangePasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
      });

      setNewPassword('');
      setConfirmPassword('');
      setChangePasswordModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alterar a senha.',
        variant: 'destructive',
      });
    }
    setChangePasswordLoading(false);
  };

  // Estatísticas
  const stats = {
    total: establishments.length,
    trial: establishments.filter(e => e.plan_status === 'trial').length,
    active: establishments.filter(e => e.plan_status === 'active').length,
    proPlus: establishments.filter(e => e.has_pro_plus).length,
    expired: establishments.filter(e => e.plan_status === 'expired').length,
  };

  // Filtrar estabelecimentos
  const filteredEstablishments = establishments.filter(est => {
    const matchesSearch = 
      est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.cpf_cnpj.includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pro_plus') return matchesSearch && est.has_pro_plus;
    return matchesSearch && est.plan_status === statusFilter;
  });

  // Handle Pro+ toggle
  const handleUpdateProPlus = async (hasProPlus: boolean) => {
    if (!selectedEstablishment) return;
    
    console.log('[Pro+ Toggle] Iniciando atualização:', {
      establishmentId: selectedEstablishment.id,
      establishmentName: selectedEstablishment.name,
      currentValue: selectedEstablishment.has_pro_plus,
      newValue: hasProPlus
    });
    
    setPlanUpdateLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('establishments')
        .update({
          has_pro_plus: hasProPlus,
          pro_plus_activated_at: hasProPlus ? new Date().toISOString() : null,
        })
        .eq('id', selectedEstablishment.id)
        .select()
        .single();

      console.log('[Pro+ Toggle] Resultado do update:', { data, error, count });

      if (error) throw error;
      
      if (!data) {
        throw new Error('A atualização não foi aplicada. Verifique suas permissões.');
      }

      // Verificar se o valor realmente mudou
      if (data.has_pro_plus !== hasProPlus) {
        console.error('[Pro+ Toggle] ALERTA: Valor não foi atualizado!', {
          expected: hasProPlus,
          actual: data.has_pro_plus
        });
        throw new Error('O valor não foi atualizado corretamente no banco.');
      }

      console.log('[Pro+ Toggle] Sucesso! Novo valor:', data.has_pro_plus);

      toast({
        title: hasProPlus ? 'Pro+ ativado!' : 'Pro+ desativado',
        description: `Recursos avançados ${hasProPlus ? 'liberados' : 'bloqueados'} para ${selectedEstablishment.name}.`,
      });

      // Update local state com o valor retornado do banco
      setSelectedEstablishment(prev => prev ? { ...prev, ...data } : null);
      await fetchEstablishments();
    } catch (error: any) {
      console.error('[Pro+ Toggle] Erro:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o plano.',
        variant: 'destructive',
      });
    }
    setPlanUpdateLoading(false);
  };

  // Get plan badge
  const getPlanBadge = (establishment: Establishment) => {
    if (establishment.plan_status === 'trial') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Trial</Badge>;
    }
    if (establishment.plan_status === 'expired') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expirado</Badge>;
    }
    if (establishment.has_pro_plus) {
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          Pro+
        </Badge>
      );
    }
    if (establishment.plan_type === 'basic') {
      return (
        <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
          📋 Básico
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <Crown className="w-3 h-3 mr-1" />
        Pro
      </Badge>
    );
  };

  // Ações do admin
  const handleActivatePlan = async (establishment: Establishment) => {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + customDays * 24 * 60 * 60 * 1000);
      
      // Determinar plan_type e has_pro_plus baseado na seleção
      const planType = selectedPlanType === 'basic' ? 'basic' : 'pro';
      const hasProPlus = selectedPlanType === 'pro_plus';
      
      const { data, error } = await supabase
        .from('establishments')
        .update({
          plan_status: 'active',
          plan_type: planType,
          plan_expires_at: expiresAt.toISOString(),
          has_pro_plus: hasProPlus,
          pro_plus_activated_at: hasProPlus ? new Date().toISOString() : null,
        })
        .eq('id', establishment.id)
        .select()
        .single();

      if (error) throw error;
      
      if (!data) {
        throw new Error('A atualização não foi aplicada. Verifique suas permissões.');
      }

      const planName = selectedPlanType === 'basic' ? 'Básico' : selectedPlanType === 'pro' ? 'Pro' : 'Pro+';

      toast({
        title: 'Plano ativado!',
        description: `${establishment.name} agora tem plano ${planName} por ${customDays} dias.`,
      });
      
      await fetchEstablishments();
      setCustomDays(30);
      setSelectedPlanType('pro');
    } catch (error: any) {
      console.error('Erro ao ativar plano:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível ativar o plano.',
        variant: 'destructive',
      });
    }
    setActionModalOpen(false);
  };

  const handleDeactivate = async (establishment: Establishment) => {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .update({
          plan_status: 'expired',
          plan_expires_at: new Date().toISOString(),
        })
        .eq('id', establishment.id)
        .select()
        .single();

      if (error) throw error;
      
      if (!data) {
        throw new Error('A atualização não foi aplicada. Verifique suas permissões.');
      }

      toast({
        title: 'Plano desativado',
        description: `${establishment.name} teve o plano expirado.`,
        variant: 'destructive',
      });
      
      await fetchEstablishments();
    } catch (error: any) {
      console.error('Erro ao desativar plano:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível desativar o plano.',
        variant: 'destructive',
      });
    }
    setActionModalOpen(false);
  };

  const handleExtendTrial = async (establishment: Establishment) => {
    try {
      const currentEnd = new Date(establishment.trial_end_date);
      const newEnd = new Date(currentEnd.getTime() + customDays * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('establishments')
        .update({
          plan_status: 'trial',
          trial_end_date: newEnd.toISOString(),
        })
        .eq('id', establishment.id)
        .select()
        .single();

      if (error) throw error;
      
      if (!data) {
        throw new Error('A atualização não foi aplicada. Verifique suas permissões.');
      }

      toast({
        title: 'Trial estendido!',
        description: `${establishment.name} ganhou +${customDays} dias de trial.`,
      });
      
      await fetchEstablishments();
      setCustomDays(30);
    } catch (error: any) {
      console.error('Erro ao estender trial:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível estender o trial.',
        variant: 'destructive',
      });
    }
    setActionModalOpen(false);
  };

  const openActionModal = (establishment: Establishment, action: 'activate' | 'deactivate' | 'extend') => {
    setSelectedEstablishment(establishment);
    setActionType(action);
    setCustomDays(action === 'extend' ? 7 : 30);
    setSelectedPlanType('pro'); // Reset para Pro por padrão
    setActionModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Trial</Badge>;
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expirado</Badge>;
      default:
        return null;
    }
  };

  const getExpirationInfo = (establishment: Establishment) => {
    if (establishment.plan_status === 'trial') {
      const daysLeft = differenceInDays(new Date(establishment.trial_end_date), new Date());
      return daysLeft > 0 ? `${daysLeft} dias restantes` : 'Expirado';
    }
    if (establishment.plan_status === 'active' && establishment.plan_expires_at) {
      const daysLeft = differenceInDays(new Date(establishment.plan_expires_at), new Date());
      return daysLeft > 0 ? `${daysLeft} dias restantes` : 'Expirado';
    }
    return '-';
  };

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Enhanced Header - Responsive */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-800/95 border-b border-slate-700 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">PEDY Admin</h1>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs shrink-0">
                  Master
                </Badge>
              </div>
              <p className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
                <span>Painel de Administração</span>
                <span className="text-slate-600">•</span>
                <span>{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {adminEmail && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-slate-300">{adminEmail}</span>
              </div>
            )}
            <AdminNotifications />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangePasswordModalOpen(true)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 px-2 sm:px-3"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Alterar Senha</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-red-400 hover:border-red-500/50 px-2 sm:px-3"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Tabs - Responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="bg-slate-800 border border-slate-700 w-full sm:w-auto inline-flex whitespace-nowrap">
              <TabsTrigger 
                value="establishments" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-2 sm:px-4"
              >
                <Building2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Estabelecimentos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-2 sm:px-4"
              >
                <FileText className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Relatórios</span>
              </TabsTrigger>
              <TabsTrigger 
                value="resellers"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-2 sm:px-4"
              >
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Revendedores</span>
              </TabsTrigger>
              <TabsTrigger 
                value="admins"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-2 sm:px-4"
              >
                <Shield className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Administradores</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Estabelecimentos Tab */}
          <TabsContent value="establishments" className="space-y-6">
            {/* Quick Actions Bar */}
            <AdminQuickActions 
              establishments={establishments}
              onRefresh={fetchEstablishments}
              lastUpdate={lastUpdate}
            />

            {/* Estatísticas com animação */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <AdminStatsCard
                icon={<Building2 className="w-6 h-6" />}
                value={stats.total}
                label="Total"
                iconBgColor="bg-slate-700"
                iconColor="text-slate-300"
              />
              <AdminStatsCard
                icon={<Clock className="w-6 h-6" />}
                value={stats.trial}
                label="Em Trial"
                iconBgColor="bg-blue-500/20"
                iconColor="text-blue-400"
                trend={stats.trial > 0 ? { value: stats.trial, label: 'testando', isPositive: true } : undefined}
              />
              <AdminStatsCard
                icon={<CheckCircle className="w-6 h-6" />}
                value={stats.active}
                label="Ativos"
                iconBgColor="bg-green-500/20"
                iconColor="text-green-400"
              />
              <AdminStatsCard
                icon={<Sparkles className="w-6 h-6" />}
                value={stats.proPlus}
                label="Pro+"
                iconBgColor="bg-purple-500/20"
                iconColor="text-purple-400"
              />
              <AdminStatsCard
                icon={<XCircle className="w-6 h-6" />}
                value={stats.expired}
                label="Expirados"
                iconBgColor="bg-red-500/20"
                iconColor="text-red-400"
              />
            </div>

            {/* Toggle Charts */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCharts(!showCharts)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChartLine className="w-4 h-4 mr-2" />
                {showCharts ? 'Ocultar Gráficos' : 'Ver Gráficos'}
              </Button>
            </div>

            {/* Charts Section */}
            {showCharts && (
              <AdminCharts establishments={establishments} />
            )}

            {/* Lista de Estabelecimentos */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Estabelecimentos</CardTitle>
                <CardDescription className="text-slate-400">
                  Gerencie todos os estabelecimentos cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="Buscar por nome, email ou CPF/CNPJ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all" className="text-white hover:bg-slate-600">Todos</SelectItem>
                      <SelectItem value="trial" className="text-white hover:bg-slate-600">Trial</SelectItem>
                      <SelectItem value="active" className="text-white hover:bg-slate-600">Ativos</SelectItem>
                      <SelectItem value="pro_plus" className="text-white hover:bg-slate-600">Pro+</SelectItem>
                      <SelectItem value="expired" className="text-white hover:bg-slate-600">Expirados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabela */}
                <div className="rounded-lg border border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-700/50">
                        <TableHead className="text-slate-300">Estabelecimento</TableHead>
                        <TableHead className="text-slate-300">CPF/CNPJ</TableHead>
                        <TableHead className="text-slate-300">Contato</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Plano</TableHead>
                        <TableHead className="text-slate-300">Expiração</TableHead>
                        <TableHead className="text-slate-300 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEstablishments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                            Nenhum estabelecimento encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEstablishments.map((establishment) => (
                          <TableRow 
                            key={establishment.id} 
                            className={`border-slate-700 hover:bg-slate-700/50 transition-colors ${
                              establishment.plan_status === 'expired' ? 'border-l-2 border-l-red-500' :
                              establishment.plan_status === 'trial' ? 'border-l-2 border-l-blue-500' :
                              establishment.has_pro_plus ? 'border-l-2 border-l-purple-500' :
                              'border-l-2 border-l-green-500'
                            }`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border border-slate-600">
                                  {establishment.logo_url ? (
                                    <AvatarImage src={establishment.logo_url} alt={establishment.name} />
                                  ) : null}
                                  <AvatarFallback className="bg-slate-700 text-slate-300 text-xs font-medium">
                                    {establishment.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-white">{establishment.name}</p>
                                  <p className="text-xs text-slate-400">{establishment.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm">{establishment.cpf_cnpj}</TableCell>
                            <TableCell className="text-slate-300 text-sm">{establishment.whatsapp}</TableCell>
                            <TableCell>{getStatusBadge(establishment.plan_status)}</TableCell>
                            <TableCell>{getPlanBadge(establishment)}</TableCell>
                            <TableCell className="text-slate-300 text-sm">{getExpirationInfo(establishment)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/admin/dashboard/${establishment.id}`)}
                                    className="text-orange-400 focus:text-orange-300 focus:bg-orange-500/20 cursor-pointer"
                                  >
                                    <Menu className="w-4 h-4 mr-2" />
                                    Gerenciar Cardápio
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => window.open(`/${establishment.slug || establishment.id}`, '_blank')}
                                    className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Ver Cardápio
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-700" />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedEstablishment(establishment);
                                      setDetailsModalOpen(true);
                                    }}
                                    className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedEstablishment(establishment);
                                      setPlanModalOpen(true);
                                    }}
                                    className="text-purple-400 focus:text-purple-300 focus:bg-purple-500/20 cursor-pointer"
                                  >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Gerenciar Plano
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-700" />
                                  {establishment.plan_status !== 'active' && (
                                    <DropdownMenuItem 
                                      onClick={() => openActionModal(establishment, 'activate')}
                                      className="text-green-400 focus:text-green-300 focus:bg-green-500/20 cursor-pointer"
                                    >
                                      <Play className="w-4 h-4 mr-2" />
                                      Ativar Pro
                                    </DropdownMenuItem>
                                  )}
                                  {establishment.plan_status === 'active' && (
                                    <DropdownMenuItem 
                                      onClick={() => openActionModal(establishment, 'deactivate')}
                                      className="text-red-400 focus:text-red-300 focus:bg-red-500/20 cursor-pointer"
                                    >
                                      <Pause className="w-4 h-4 mr-2" />
                                      Desativar Plano
                                    </DropdownMenuItem>
                                  )}
                                  {establishment.plan_status === 'trial' && (
                                    <DropdownMenuItem 
                                      onClick={() => openActionModal(establishment, 'extend')}
                                      className="text-blue-400 focus:text-blue-300 focus:bg-blue-500/20 cursor-pointer"
                                    >
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Estender Trial
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Administradores Tab */}
          <TabsContent value="admins" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{admins.length}</p>
                      <p className="text-sm text-slate-400">Total de Administradores</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Adicionar novo administrador</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setAddAdminModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Administradores */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Administradores</CardTitle>
                <CardDescription className="text-slate-400">
                  Gerencie os administradores do painel master
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-slate-700/50">
                          <TableHead className="text-slate-300">Email</TableHead>
                          <TableHead className="text-slate-300">Data de Cadastro</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                          <TableHead className="text-slate-300 text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                              Nenhum administrador encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          admins.map((admin) => (
                            <TableRow key={admin.user_id} className="border-slate-700 hover:bg-slate-700/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-white">{admin.email}</p>
                                  {admin.is_current_user && (
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                      Você
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {admin.created_at ? format(new Date(admin.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  Ativo
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {!admin.is_current_user && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedAdmin(admin);
                                      setRemoveAdminModalOpen(true);
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revendedores Tab */}
          <TabsContent value="resellers" className="space-y-6">
            <ResellerManagement />
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="reports" className="space-y-6">
            <AdminReports establishments={establishments} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de Detalhes do Estabelecimento */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Detalhes do Estabelecimento</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informações completas do estabelecimento
            </DialogDescription>
          </DialogHeader>
          {selectedEstablishment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Nome</p>
                  <p className="font-medium">{selectedEstablishment.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  {getStatusBadge(selectedEstablishment.plan_status)}
                </div>
                <div>
                  <p className="text-sm text-slate-400">CPF/CNPJ</p>
                  <p className="font-medium">{selectedEstablishment.cpf_cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">WhatsApp</p>
                  <p className="font-medium">{selectedEstablishment.whatsapp}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="font-medium">{selectedEstablishment.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Chave Pix</p>
                  <p className="font-medium">{selectedEstablishment.pix_key || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Início do Trial</p>
                  <p className="font-medium">
                    {format(new Date(selectedEstablishment.trial_start_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Fim do Trial</p>
                  <p className="font-medium">
                    {format(new Date(selectedEstablishment.trial_end_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Data de Cadastro</p>
                  <p className="font-medium">
                    {format(new Date(selectedEstablishment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                {selectedEstablishment.plan_expires_at && (
                  <div>
                    <p className="text-sm text-slate-400">Expiração do Plano</p>
                    <p className="font-medium">
                      {format(new Date(selectedEstablishment.plan_expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)} className="border-slate-600">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Ação */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'activate' && 'Ativar Plano'}
              {actionType === 'deactivate' && 'Desativar Plano'}
              {actionType === 'extend' && 'Estender Trial'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {actionType === 'activate' && 'Escolha o plano e a duração para este estabelecimento.'}
              {actionType === 'deactivate' && 'Isso expirará o plano imediatamente. O estabelecimento perderá o acesso.'}
              {actionType === 'extend' && 'Escolha quantos dias deseja adicionar ao trial.'}
            </DialogDescription>
          </DialogHeader>
          {selectedEstablishment && (
            <div className="space-y-4 py-4">
              <p className="text-slate-300">
                Estabelecimento: <span className="font-medium text-white">{selectedEstablishment.name}</span>
              </p>
              
              {/* Seleção de tipo de plano - apenas para ativar */}
              {actionType === 'activate' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">
                    Selecione o plano
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanType('basic')}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedPlanType === 'basic'
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      }`}
                    >
                      <p className="text-xs text-slate-400">📋</p>
                      <p className={`font-medium text-sm ${selectedPlanType === 'basic' ? 'text-blue-400' : 'text-slate-300'}`}>
                        Básico
                      </p>
                      <p className="text-xs text-slate-500">R$ 37/mês</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanType('pro')}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedPlanType === 'pro'
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      }`}
                    >
                      <p className="text-xs text-slate-400">🚀</p>
                      <p className={`font-medium text-sm ${selectedPlanType === 'pro' ? 'text-green-400' : 'text-slate-300'}`}>
                        Pro
                      </p>
                      <p className="text-xs text-slate-500">R$ 59,90/mês</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanType('pro_plus')}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedPlanType === 'pro_plus'
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      }`}
                    >
                      <p className="text-xs text-slate-400">⭐</p>
                      <p className={`font-medium text-sm ${selectedPlanType === 'pro_plus' ? 'text-purple-400' : 'text-slate-300'}`}>
                        Pro+
                      </p>
                      <p className="text-xs text-slate-500">R$ 79,90/mês</p>
                    </button>
                  </div>
                  
                  {/* Info sobre plano selecionado */}
                  <div className="p-2 bg-slate-700/30 rounded-lg text-xs text-slate-400">
                    {selectedPlanType === 'basic' && 'Cardápio digital + templates WhatsApp (sem painel de pedidos)'}
                    {selectedPlanType === 'pro' && 'Cardápio + painel de pedidos + push + cupons + métricas básicas'}
                    {selectedPlanType === 'pro_plus' && 'Todos recursos + pizza multi-sabor + analytics avançado + CRM'}
                  </div>
                </div>
              )}
              
              {/* Campo de dias - apenas para ativar e estender */}
              {(actionType === 'activate' || actionType === 'extend') && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">
                    Quantidade de dias
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  
                  {/* Atalhos rápidos */}
                  <div className="flex flex-wrap gap-2">
                    {actionType === 'activate' && (
                      <>
                        <Button 
                          size="sm" 
                          variant={customDays === 30 ? "default" : "outline"} 
                          onClick={() => setCustomDays(30)}
                          className={customDays === 30 ? "bg-green-600" : "border-slate-600 text-slate-300"}
                        >
                          Mensal (30)
                        </Button>
                        <Button 
                          size="sm" 
                          variant={customDays === 90 ? "default" : "outline"} 
                          onClick={() => setCustomDays(90)}
                          className={customDays === 90 ? "bg-green-600" : "border-slate-600 text-slate-300"}
                        >
                          Trimestral (90)
                        </Button>
                        <Button 
                          size="sm" 
                          variant={customDays === 180 ? "default" : "outline"} 
                          onClick={() => setCustomDays(180)}
                          className={customDays === 180 ? "bg-green-600" : "border-slate-600 text-slate-300"}
                        >
                          Semestral (180)
                        </Button>
                        <Button 
                          size="sm" 
                          variant={customDays === 365 ? "default" : "outline"} 
                          onClick={() => setCustomDays(365)}
                          className={customDays === 365 ? "bg-green-600" : "border-slate-600 text-slate-300"}
                        >
                          Anual (365)
                        </Button>
                      </>
                    )}
                    {actionType === 'extend' && (
                      <>
                        <Button 
                          size="sm" 
                          variant={customDays === 1 ? "default" : "outline"} 
                          onClick={() => setCustomDays(1)}
                          className={customDays === 1 ? "bg-blue-600" : "border-slate-600 text-slate-300"}
                        >
                          +1 dia
                        </Button>
                        <Button 
                          size="sm" 
                          variant={customDays === 3 ? "default" : "outline"} 
                          onClick={() => setCustomDays(3)}
                          className={customDays === 3 ? "bg-blue-600" : "border-slate-600 text-slate-300"}
                        >
                          +3 dias
                        </Button>
                        <Button 
                          size="sm" 
                          variant={customDays === 7 ? "default" : "outline"} 
                          onClick={() => setCustomDays(7)}
                          className={customDays === 7 ? "bg-blue-600" : "border-slate-600 text-slate-300"}
                        >
                          +7 dias
                        </Button>
                        <Button 
                          size="sm" 
                          variant={customDays === 15 ? "default" : "outline"} 
                          onClick={() => setCustomDays(15)}
                          className={customDays === 15 ? "bg-blue-600" : "border-slate-600 text-slate-300"}
                        >
                          +15 dias
                        </Button>
                        <Button 
                          size="sm" 
                          variant={customDays === 30 ? "default" : "outline"} 
                          onClick={() => setCustomDays(30)}
                          className={customDays === 30 ? "bg-blue-600" : "border-slate-600 text-slate-300"}
                        >
                          +30 dias
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionModalOpen(false)} className="border-slate-600">
              Cancelar
            </Button>
            {actionType === 'activate' && selectedEstablishment && (
              <Button onClick={() => handleActivatePlan(selectedEstablishment)} className="bg-green-600 hover:bg-green-700">
                Ativar {selectedPlanType === 'basic' ? 'Básico' : selectedPlanType === 'pro' ? 'Pro' : 'Pro+'} ({customDays} dias)
              </Button>
            )}
            {actionType === 'deactivate' && selectedEstablishment && (
              <Button onClick={() => handleDeactivate(selectedEstablishment)} className="bg-red-600 hover:bg-red-700">
                Desativar
              </Button>
            )}
            {actionType === 'extend' && selectedEstablishment && (
              <Button onClick={() => handleExtendTrial(selectedEstablishment)} className="bg-blue-600 hover:bg-blue-700">
                Estender (+{customDays} dias)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Admin */}
      <Dialog open={addAdminModalOpen} onOpenChange={setAddAdminModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
            <DialogDescription className="text-slate-400">
              Preencha os dados do novo administrador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Email</label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Senha</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setAddAdminModalOpen(false);
                setNewAdminEmail('');
                setNewAdminPassword('');
              }} 
              className="border-slate-600"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateAdmin} 
              disabled={createAdminLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {createAdminLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Administrador
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Remover Admin */}
      <Dialog open={removeAdminModalOpen} onOpenChange={setRemoveAdminModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Remover Administrador</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem certeza que deseja remover este administrador? Ele perderá acesso ao painel master.
            </DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <div className="py-4">
              <p className="text-slate-300">
                Administrador: <span className="font-medium text-white">{selectedAdmin.email}</span>
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setRemoveAdminModalOpen(false);
                setSelectedAdmin(null);
              }} 
              className="border-slate-600"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRemoveAdmin} 
              disabled={removeAdminLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeAdminLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Alterar Senha */}
      <Dialog open={changePasswordModalOpen} onOpenChange={setChangePasswordModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5" />
              Alterar Minha Senha
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Digite sua nova senha abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Nova Senha</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Confirmar Nova Senha</label>
              <Input
                type="password"
                placeholder="Digite novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangePasswordModalOpen(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {changePasswordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Gerenciar Plano */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gerenciar Plano
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure o tipo de plano e recursos avançados
            </DialogDescription>
          </DialogHeader>
          
          {selectedEstablishment && (
            <div className="space-y-6 py-4">
              {/* Establishment Info */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">Estabelecimento</p>
                <p className="font-medium text-white">{selectedEstablishment.name}</p>
              </div>

              {/* Current Plan Status */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">Status Atual</p>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedEstablishment.plan_status)}
                  {getPlanBadge(selectedEstablishment)}
                </div>
              </div>

              {/* Plan Type Info */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">Tipos de Plano</p>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-green-400" />
                      <span className="font-medium text-green-400">Plano Pro (R$ 37/mês)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Recursos básicos + pizza até 2 sabores
                    </p>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="font-medium text-purple-400">Plano Pro+</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Todos os recursos avançados:
                    </p>
                    <ul className="text-xs text-slate-400 mt-1 ml-4 list-disc space-y-0.5">
                      <li>Pizza com 3 ou 4 sabores</li>
                      <li>Regras avançadas de montagem</li>
                      <li>Limites dinâmicos de seleção</li>
                      <li>Precificação avançada</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pro+ Toggle */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">Ativação Pro+</p>
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center gap-3">
                    <Sparkles className={`w-5 h-5 ${selectedEstablishment.has_pro_plus ? 'text-purple-400' : 'text-slate-500'}`} />
                    <div>
                      <p className="font-medium text-white">Recursos Avançados</p>
                      <p className="text-xs text-slate-400">
                        {selectedEstablishment.has_pro_plus ? 'Liberados' : 'Bloqueados'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={selectedEstablishment.has_pro_plus}
                    onCheckedChange={handleUpdateProPlus}
                    disabled={planUpdateLoading}
                  />
                </div>

                {selectedEstablishment.pro_plus_activated_at && selectedEstablishment.has_pro_plus && (
                  <p className="text-xs text-slate-500 text-center">
                    Ativado em: {format(new Date(selectedEstablishment.pro_plus_activated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  <strong>Nota:</strong> A alteração é aplicada imediatamente. O estabelecimento não precisa recriar produtos ou cardápio.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlanModalOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
