import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Eye, EyeOff, Loader2, Zap, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdmins, setIsCheckingAdmins] = useState(true);
  const [hasAdmins, setHasAdmins] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  // Password reset states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    checkForAdmins();
  }, []);

  const checkForAdmins = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('bootstrap-admin', {
        body: { action: 'check' }
      });

      if (error) {
        console.error('Error checking admins:', error);
        setHasAdmins(true); // Assume has admins on error
      } else {
        setHasAdmins(data?.hasAdmins ?? true);
      }
    } catch (error) {
      console.error('Error checking admins:', error);
      setHasAdmins(true);
    } finally {
      setIsCheckingAdmins(false);
    }
  };

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      const { data, error } = await supabase.functions.invoke('bootstrap-admin', {
        body: { action: 'bootstrap' }
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível inicializar o sistema.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        toast({
          title: 'Sistema inicializado!',
          description: `Admin master criado: ${data.email}`,
        });
        setHasAdmins(true);
        setEmail(data.email);
      } else {
        toast({
          title: 'Erro',
          description: data?.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao inicializar o sistema.',
        variant: 'destructive',
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        toast({
          title: 'Credenciais inválidas',
          description: 'Email ou senha incorretos.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast({
          title: 'Erro de autenticação',
          description: 'Não foi possível autenticar.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        toast({
          title: 'Acesso não autorizado',
          description: 'Você não tem permissão para acessar o painel administrativo.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo ao painel administrativo!',
      });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao tentar fazer login.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: 'Erro',
        description: 'Informe o email do administrador.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-admin-password', {
        body: { email: resetEmail, new_password: newPassword }
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível redefinir a senha.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        toast({
          title: 'Senha redefinida!',
          description: 'Você já pode fazer login com a nova senha.',
        });
        setResetModalOpen(false);
        setResetEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setEmail(resetEmail);
      } else {
        toast({
          title: 'Erro',
          description: data?.error || 'Erro ao redefinir senha.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao redefinir a senha.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isCheckingAdmins) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Verificando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Painel Master</CardTitle>
          <CardDescription className="text-slate-400">
            {hasAdmins 
              ? 'Acesso restrito para administradores do sistema'
              : 'Sistema não inicializado - Clique abaixo para criar o admin master'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAdmins ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 text-sm text-center">
                  ⚠️ Nenhum administrador encontrado no sistema.
                </p>
                <p className="text-slate-400 text-xs text-center mt-2">
                  Clique no botão abaixo para criar o admin master inicial.
                </p>
              </div>
              
              <Button
                onClick={handleBootstrap}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isBootstrapping}
              >
                {isBootstrapping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Inicializar Sistema
                  </>
                )}
              </Button>

              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-400 text-center">
                  Um administrador master será criado automaticamente.<br />
                  <span className="text-slate-300">Entre em contato com o suporte para obter as credenciais.</span>
                </p>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="w-full mt-3 text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Esqueci minha senha
              </button>
              
              <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-400 text-center">
                  ⚠️ Acesso restrito a administradores autorizados.<br />
                  Entre em contato com o suporte para obter acesso.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Password Reset Modal */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-red-500" />
              Redefinir Senha de Admin
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Informe o email do administrador e a nova senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="text-slate-300">Email do administrador</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="admin@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-300">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">As senhas não coincidem</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setResetModalOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePasswordReset}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isResetting || !resetEmail || newPassword.length < 6 || newPassword !== confirmPassword}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoginPage;
