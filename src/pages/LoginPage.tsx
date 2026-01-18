import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pedyLogo from '@/assets/logo_pedy.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowLeft, User, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const REMEMBER_IDENTIFIER_KEY = 'pedy_remembered_identifier';

// Extrai apenas dígitos de uma string
const extractDigits = (value: string): string => value.replace(/\D/g, '');

// Detecta o tipo de identificador
const detectIdentifierType = (identifier: string): 'email' | 'cpf' | 'cnpj' | 'phone' => {
  if (identifier.includes('@')) return 'email';
  
  const digits = extractDigits(identifier);
  if (digits.length === 11 && !digits.startsWith('0')) return 'cpf';
  if (digits.length === 14) return 'cnpj';
  if (digits.length >= 10 && digits.length <= 11) return 'phone';
  
  // Fallback para CPF se tiver 11 dígitos
  if (digits.length === 11) return 'cpf';
  
  return 'email'; // Default
};

// Busca o e-mail associado ao identificador
const resolveEmailFromIdentifier = async (identifier: string): Promise<string | null> => {
  const type = detectIdentifierType(identifier);
  
  if (type === 'email') return identifier;
  
  const digits = extractDigits(identifier);
  
  let query = supabase.from('establishments').select('email');
  
  if (type === 'phone') {
    query = query.eq('whatsapp', digits);
  } else {
    // CPF ou CNPJ
    query = query.eq('cpf_cnpj', digits);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error || !data) return null;
  
  return data.email;
};

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedIdentifier = localStorage.getItem(REMEMBER_IDENTIFIER_KEY);
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Resolver o e-mail a partir do identificador
      const email = await resolveEmailFromIdentifier(identifier.trim());
      
      if (!email) {
        const type = detectIdentifierType(identifier);
        const typeLabel = type === 'phone' ? 'celular' : 'CPF/CNPJ';
        throw new Error(`Não encontramos uma conta com esse ${typeLabel}.`);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Salvar ou remover identificador do localStorage
      if (rememberMe) {
        localStorage.setItem(REMEMBER_IDENTIFIER_KEY, identifier);
      } else {
        localStorage.removeItem(REMEMBER_IDENTIFIER_KEY);
      }

      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Ocorreu um erro ao fazer login.';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Identificador ou senha incorretos.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <img src={pedyLogo} alt="PEDY" className="h-28 md:h-32 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-foreground">Entrar na sua conta</h1>
            <p className="text-muted-foreground mt-1">
              Acesse o painel do seu estabelecimento
            </p>
          </div>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">E-mail, Celular ou CPF/CNPJ</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="seu@email.com, celular ou CPF/CNPJ"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link 
                      to="/recuperar-senha" 
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label 
                    htmlFor="rememberMe" 
                    className="text-sm font-normal text-muted-foreground cursor-pointer"
                  >
                    Lembrar meus dados
                  </Label>
                </div>

                <Button
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
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

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Ainda não tem conta?{' '}
                  <Link to="/cadastro" className="text-primary font-medium hover:underline">
                    Criar conta grátis
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
