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
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Play,
  Pause,
  Calendar,
  Building2,
  UserPlus,
  UserCog,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockEstablishments, mockAdmins } from '@/lib/mockData';
import { Establishment, Admin } from '@/types';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [establishments, setEstablishments] = useState<Establishment[]>(mockEstablishments);
  const [admins, setAdmins] = useState<Admin[]>(mockAdmins);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [adminActionModalOpen, setAdminActionModalOpen] = useState(false);
  const [adminAction, setAdminAction] = useState<'activate' | 'deactivate' | 'remove'>('activate');
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'extend'>('activate');
  const [activeTab, setActiveTab] = useState('establishments');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // Verificar autenticação (simulação - em produção usar Lovable Cloud)
  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminAuth');
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const currentAdminName = sessionStorage.getItem('adminName') || 'Administrador';

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  // Estatísticas
  const stats = {
    total: establishments.length,
    trial: establishments.filter(e => e.planStatus === 'trial').length,
    active: establishments.filter(e => e.planStatus === 'active').length,
    expired: establishments.filter(e => e.planStatus === 'expired').length,
  };

  // Filtrar estabelecimentos
  const filteredEstablishments = establishments.filter(est => {
    const matchesSearch = 
      est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.cpfCnpj.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || est.planStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Ações do admin
  const handleActivatePro = (establishment: Establishment) => {
    setEstablishments(prev => prev.map(e => {
      if (e.id === establishment.id) {
        const now = new Date();
        return {
          ...e,
          planStatus: 'active' as const,
          planExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 dias
        };
      }
      return e;
    }));
    toast({
      title: 'Plano ativado!',
      description: `${establishment.name} agora tem plano Pro por 30 dias.`,
    });
    setActionModalOpen(false);
  };

  const handleDeactivate = (establishment: Establishment) => {
    setEstablishments(prev => prev.map(e => {
      if (e.id === establishment.id) {
        return {
          ...e,
          planStatus: 'expired' as const,
          planExpiresAt: new Date(),
        };
      }
      return e;
    }));
    toast({
      title: 'Plano desativado',
      description: `${establishment.name} teve o plano expirado.`,
      variant: 'destructive',
    });
    setActionModalOpen(false);
  };

  const handleExtendTrial = (establishment: Establishment) => {
    setEstablishments(prev => prev.map(e => {
      if (e.id === establishment.id) {
        const currentEnd = new Date(e.trialEndDate);
        return {
          ...e,
          planStatus: 'trial' as const,
          trialEndDate: new Date(currentEnd.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 dias
        };
      }
      return e;
    }));
    toast({
      title: 'Trial estendido!',
      description: `${establishment.name} ganhou +7 dias de trial.`,
    });
    setActionModalOpen(false);
  };

  const openActionModal = (establishment: Establishment, action: 'activate' | 'deactivate' | 'extend') => {
    setSelectedEstablishment(establishment);
    setActionType(action);
    setActionModalOpen(true);
  };

  // Ações para administradores
  const handleToggleAdminStatus = (admin: Admin) => {
    const newStatus = !admin.isActive;
    setAdmins(prev => prev.map(a => {
      if (a.id === admin.id) {
        return { ...a, isActive: newStatus };
      }
      return a;
    }));
    // Atualizar mockAdmins também
    const idx = mockAdmins.findIndex(a => a.id === admin.id);
    if (idx !== -1) {
      mockAdmins[idx].isActive = newStatus;
    }
    toast({
      title: newStatus ? 'Admin ativado!' : 'Admin desativado!',
      description: `${admin.name} foi ${newStatus ? 'ativado' : 'desativado'}.`,
    });
    setAdminActionModalOpen(false);
  };

  const handleRemoveAdmin = (admin: Admin) => {
    setAdmins(prev => prev.filter(a => a.id !== admin.id));
    // Remover do mockAdmins também
    const idx = mockAdmins.findIndex(a => a.id === admin.id);
    if (idx !== -1) {
      mockAdmins.splice(idx, 1);
    }
    toast({
      title: 'Admin removido!',
      description: `${admin.name} foi removido do sistema.`,
      variant: 'destructive',
    });
    setAdminActionModalOpen(false);
  };

  const openAdminActionModal = (admin: Admin, action: 'activate' | 'deactivate' | 'remove') => {
    setSelectedAdmin(admin);
    setAdminAction(action);
    setAdminActionModalOpen(true);
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(adminSearchTerm.toLowerCase())
  );

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
    if (establishment.planStatus === 'trial') {
      const daysLeft = differenceInDays(new Date(establishment.trialEndDate), new Date());
      return daysLeft > 0 ? `${daysLeft} dias restantes` : 'Expirado';
    }
    if (establishment.planStatus === 'active' && establishment.planExpiresAt) {
      const daysLeft = differenceInDays(new Date(establishment.planExpiresAt), new Date());
      return daysLeft > 0 ? `${daysLeft} dias restantes` : 'Expirado';
    }
    return '-';
  };

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
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
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

        {/* Tabs para Estabelecimentos e Administradores */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="establishments" className="data-[state=active]:bg-slate-700">
              <Building2 className="w-4 h-4 mr-2" />
              Estabelecimentos
            </TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-slate-700">
              <UserCog className="w-4 h-4 mr-2" />
              Administradores
            </TabsTrigger>
          </TabsList>

          {/* Tab Estabelecimentos */}
          <TabsContent value="establishments">
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
                            <TableCell className="text-slate-300">{establishment.cpfCnpj}</TableCell>
                            <TableCell className="text-slate-300">{establishment.whatsapp}</TableCell>
                            <TableCell>{getStatusBadge(establishment.planStatus)}</TableCell>
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
                                {establishment.planStatus !== 'active' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openActionModal(establishment, 'activate')}
                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                                {establishment.planStatus === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openActionModal(establishment, 'deactivate')}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  >
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                )}
                                {establishment.planStatus === 'trial' && (
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

          {/* Tab Administradores */}
          <TabsContent value="admins">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Administradores</CardTitle>
                  <CardDescription className="text-slate-400">
                    Gerencie os administradores do sistema
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => navigate('/admin/cadastro')} 
                  className="bg-red-600 hover:bg-red-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Admin
                </Button>
              </CardHeader>
              <CardContent>
                {/* Busca */}
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={adminSearchTerm}
                      onChange={(e) => setAdminSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Tabela de Admins */}
                <div className="rounded-lg border border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-700/50">
                        <TableHead className="text-slate-300">Nome</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Cadastrado em</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdmins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                            Nenhum administrador encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAdmins.map((admin) => (
                          <TableRow key={admin.id} className="border-slate-700 hover:bg-slate-700/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {admin.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <p className="font-medium text-white">{admin.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{admin.email}</TableCell>
                            <TableCell className="text-slate-300">
                              {format(new Date(admin.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {admin.isActive ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {admin.isActive ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openAdminActionModal(admin, 'deactivate')}
                                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                                  >
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openAdminActionModal(admin, 'activate')}
                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openAdminActionModal(admin, 'remove')}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
        </Tabs>
      </main>

      {/* Modal de Detalhes */}
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
                  {getStatusBadge(selectedEstablishment.planStatus)}
                </div>
                <div>
                  <p className="text-sm text-slate-400">CPF/CNPJ</p>
                  <p className="font-medium">{selectedEstablishment.cpfCnpj}</p>
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
                  <p className="font-medium">{selectedEstablishment.pixKey || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Início do Trial</p>
                  <p className="font-medium">
                    {format(new Date(selectedEstablishment.trialStartDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Fim do Trial</p>
                  <p className="font-medium">
                    {format(new Date(selectedEstablishment.trialEndDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Data de Cadastro</p>
                  <p className="font-medium">
                    {format(new Date(selectedEstablishment.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                {selectedEstablishment.planExpiresAt && (
                  <div>
                    <p className="text-sm text-slate-400">Expiração do Plano</p>
                    <p className="font-medium">
                      {format(new Date(selectedEstablishment.planExpiresAt), 'dd/MM/yyyy', { locale: ptBR })}
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

      {/* Modal de Ação para Admins */}
      <Dialog open={adminActionModalOpen} onOpenChange={setAdminActionModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {adminAction === 'activate' && 'Ativar Administrador'}
              {adminAction === 'deactivate' && 'Desativar Administrador'}
              {adminAction === 'remove' && 'Remover Administrador'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {adminAction === 'activate' && 'Isso permitirá que este administrador acesse o sistema novamente.'}
              {adminAction === 'deactivate' && 'Isso impedirá que este administrador faça login no sistema.'}
              {adminAction === 'remove' && 'Isso removerá permanentemente este administrador do sistema.'}
            </DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <div className="py-4">
              <p className="text-slate-300">
                Administrador: <span className="font-medium text-white">{selectedAdmin.name}</span>
              </p>
              <p className="text-slate-400 text-sm">{selectedAdmin.email}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAdminActionModalOpen(false)} className="border-slate-600">
              Cancelar
            </Button>
            {adminAction === 'activate' && selectedAdmin && (
              <Button onClick={() => handleToggleAdminStatus(selectedAdmin)} className="bg-green-600 hover:bg-green-700">
                Ativar
              </Button>
            )}
            {adminAction === 'deactivate' && selectedAdmin && (
              <Button onClick={() => handleToggleAdminStatus(selectedAdmin)} className="bg-yellow-600 hover:bg-yellow-700">
                Desativar
              </Button>
            )}
            {adminAction === 'remove' && selectedAdmin && (
              <Button onClick={() => handleRemoveAdmin(selectedAdmin)} className="bg-red-600 hover:bg-red-700">
                Remover
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
