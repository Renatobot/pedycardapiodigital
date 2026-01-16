import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Establishment {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cpf_cnpj: string;
  pix_key: string | null;
  logo_url: string | null;
  plan_status: string;
  plan_expires_at: string | null;
  trial_start_date: string;
  trial_end_date: string;
  created_at: string;
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
    expired: establishments.filter(e => e.plan_status === 'expired').length,
  };

  // Filtrar estabelecimentos
  const filteredEstablishments = establishments.filter(est => {
    const matchesSearch = 
      est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.cpf_cnpj.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || est.plan_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Ações do admin
  const handleActivatePro = async (establishment: Establishment) => {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('establishments')
        .update({
          plan_status: 'active',
          plan_expires_at: expiresAt.toISOString(),
        })
        .eq('id', establishment.id);

      if (error) throw error;

      toast({
        title: 'Plano ativado!',
        description: `${establishment.name} agora tem plano Pro por 30 dias.`,
      });
      
      await fetchEstablishments();
    } catch (error) {
      console.error('Erro ao ativar plano:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar o plano.',
        variant: 'destructive',
      });
    }
    setActionModalOpen(false);
  };

  const handleDeactivate = async (establishment: Establishment) => {
    try {
      const { error } = await supabase
        .from('establishments')
        .update({
          plan_status: 'expired',
          plan_expires_at: new Date().toISOString(),
        })
        .eq('id', establishment.id);

      if (error) throw error;

      toast({
        title: 'Plano desativado',
        description: `${establishment.name} teve o plano expirado.`,
        variant: 'destructive',
      });
      
      await fetchEstablishments();
    } catch (error) {
      console.error('Erro ao desativar plano:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desativar o plano.',
        variant: 'destructive',
      });
    }
    setActionModalOpen(false);
  };

  const handleExtendTrial = async (establishment: Establishment) => {
    try {
      const currentEnd = new Date(establishment.trial_end_date);
      const newEnd = new Date(currentEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('establishments')
        .update({
          plan_status: 'trial',
          trial_end_date: newEnd.toISOString(),
        })
        .eq('id', establishment.id);

      if (error) throw error;

      toast({
        title: 'Trial estendido!',
        description: `${establishment.name} ganhou +7 dias de trial.`,
      });
      
      await fetchEstablishments();
    } catch (error) {
      console.error('Erro ao estender trial:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível estender o trial.',
        variant: 'destructive',
      });
    }
    setActionModalOpen(false);
  };

  const openActionModal = (establishment: Establishment, action: 'activate' | 'deactivate' | 'extend') => {
    setSelectedEstablishment(establishment);
    setActionType(action);
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
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PEDY Admin</h1>
              <p className="text-xs text-slate-400">Painel de Administração Master</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setChangePasswordModalOpen(true)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Key className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger 
              value="establishments" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Estabelecimentos
            </TabsTrigger>
            <TabsTrigger 
              value="admins"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
            >
              <Users className="w-4 h-4 mr-2" />
              Administradores
            </TabsTrigger>
          </TabsList>

          {/* Estabelecimentos Tab */}
          <TabsContent value="establishments" className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
                      <p className="text-sm text-slate-400">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.trial}</p>
                      <p className="text-sm text-slate-400">Em Trial</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.active}</p>
                      <p className="text-sm text-slate-400">Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.expired}</p>
                      <p className="text-sm text-slate-400">Expirados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                        <TableHead className="text-slate-300">Expiração</TableHead>
                        <TableHead className="text-slate-300 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEstablishments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                            Nenhum estabelecimento encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEstablishments.map((establishment) => (
                          <TableRow key={establishment.id} className="border-slate-700 hover:bg-slate-700/50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-white">{establishment.name}</p>
                                <p className="text-sm text-slate-400">{establishment.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{establishment.cpf_cnpj}</TableCell>
                            <TableCell className="text-slate-300">{establishment.whatsapp}</TableCell>
                            <TableCell>{getStatusBadge(establishment.plan_status)}</TableCell>
                            <TableCell className="text-slate-300">{getExpirationInfo(establishment)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedEstablishment(establishment);
                                    setDetailsModalOpen(true);
                                  }}
                                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {establishment.plan_status !== 'active' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openActionModal(establishment, 'activate')}
                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                                {establishment.plan_status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openActionModal(establishment, 'deactivate')}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  >
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                )}
                                {establishment.plan_status === 'trial' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openActionModal(establishment, 'extend')}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                  >
                                    <Calendar className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
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
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'activate' && 'Ativar Plano Pro'}
              {actionType === 'deactivate' && 'Desativar Plano'}
              {actionType === 'extend' && 'Estender Trial'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {actionType === 'activate' && 'Isso ativará o plano Pro por 30 dias para este estabelecimento.'}
              {actionType === 'deactivate' && 'Isso expirará o plano imediatamente. O estabelecimento perderá o acesso.'}
              {actionType === 'extend' && 'Isso adicionará 7 dias ao período de trial.'}
            </DialogDescription>
          </DialogHeader>
          {selectedEstablishment && (
            <div className="py-4">
              <p className="text-slate-300">
                Estabelecimento: <span className="font-medium text-white">{selectedEstablishment.name}</span>
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionModalOpen(false)} className="border-slate-600">
              Cancelar
            </Button>
            {actionType === 'activate' && selectedEstablishment && (
              <Button onClick={() => handleActivatePro(selectedEstablishment)} className="bg-green-600 hover:bg-green-700">
                Ativar Pro
              </Button>
            )}
            {actionType === 'deactivate' && selectedEstablishment && (
              <Button onClick={() => handleDeactivate(selectedEstablishment)} className="bg-red-600 hover:bg-red-700">
                Desativar
              </Button>
            )}
            {actionType === 'extend' && selectedEstablishment && (
              <Button onClick={() => handleExtendTrial(selectedEstablishment)} className="bg-blue-600 hover:bg-blue-700">
                Estender Trial
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
    </div>
  );
};

export default AdminDashboardPage;
