import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import pedyLogo from '@/assets/logo_pedy.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft, Store, Mail, Lock, Phone, Upload, FileText, Loader2, MapPin, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/lib/utils';

interface ResellerInfo {
  id: string;
  name: string;
  price_basic: number;
  price_pro: number;
  price_pro_plus: number;
  pricing_mode: string;
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    establishmentName: '',
    city: '',
    cpfCnpj: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reseller, setReseller] = useState<ResellerInfo | null>(null);
  const [loadingReseller, setLoadingReseller] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch reseller info from referral code
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      fetchReseller(refCode);
    }
  }, [searchParams]);

  const fetchReseller = async (code: string) => {
    setLoadingReseller(true);
    try {
      const { data, error } = await supabase.rpc('get_reseller_by_code', { code });
      
      if (error) {
        console.error('Error fetching reseller:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setReseller(data[0]);
      }
    } catch (error) {
      console.error('Error fetching reseller:', error);
    } finally {
      setLoadingReseller(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (userId: string): Promise<string | null> => {
    if (!logo) return null;

    const fileExt = logo.name.split('.').pop();
    const fileName = `${userId}-logo.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, logo);

    if (uploadError) {
      console.error('Logo upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const sendWelcomeEmail = async (email: string, establishmentName: string) => {
    try {
      await supabase.functions.invoke('send-plan-notification', {
        body: {
          type: 'welcome',
          email,
          establishmentName
        }
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw - welcome email is not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Não foi possível criar a conta.');
      }

      // 2. Upload logo if provided
      const logoUrl = await uploadLogo(authData.user.id);

      // 3. Generate unique slug
      let baseSlug = generateSlug(formData.establishmentName);
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug exists and make it unique
      while (true) {
        const { data: existingSlug } = await supabase
          .from('establishments')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        if (!existingSlug) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // 4. Create establishment record with slug and reseller info
      const refCode = searchParams.get('ref');
      const { error: establishmentError } = await supabase
        .from('establishments')
        .insert({
          user_id: authData.user.id,
          name: formData.establishmentName,
          logo_url: logoUrl,
          cpf_cnpj: formData.cpfCnpj,
          whatsapp: formData.whatsapp,
          email: formData.email,
          city: formData.city,
          slug: slug,
          reseller_id: reseller?.id || null,
          referral_code: refCode || null,
        });

      if (establishmentError) throw establishmentError;

      // 4. Send welcome email
      await sendWelcomeEmail(formData.email, formData.establishmentName);

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Seu teste grátis de 7 dias começou. Boas vendas!',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Ocorreu um erro ao criar sua conta.';
      
      // Verificar erros de unicidade do Supabase Auth
      if (error.message?.includes('already registered')) {
        errorMessage = 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.';
      } 
      // Verificar erros de constraint de unicidade do PostgreSQL
      else if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        if (error.message?.includes('cpf_cnpj') || error.details?.includes('cpf_cnpj')) {
          errorMessage = 'Este CPF/CNPJ já está cadastrado em outro estabelecimento. Se seu trial expirou, entre em contato para fazer o upgrade.';
        } else if (error.message?.includes('whatsapp') || error.details?.includes('whatsapp')) {
          errorMessage = 'Este WhatsApp já está cadastrado em outro estabelecimento. Se seu trial expirou, entre em contato para fazer o upgrade.';
        } else if (error.message?.includes('email') || error.details?.includes('email')) {
          errorMessage = 'Este e-mail já está cadastrado. Faça login ou entre em contato se precisar de ajuda.';
        } else {
          errorMessage = 'Alguns dados informados já estão em uso por outro estabelecimento. Se seu trial expirou, entre em contato para fazer o upgrade.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erro no cadastro',
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

      <div className="flex-1 flex items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-6">
            <img src={pedyLogo} alt="PEDY" className="h-28 md:h-32 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-foreground">Criar conta grátis</h1>
            <p className="text-muted-foreground mt-1">
              Comece seu teste de 7 dias agora
            </p>
          </div>

          {/* Referral Banner */}
          {reseller && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Indicação: {reseller.name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Você foi indicado por um parceiro PEDY
                </p>
              </div>
            </div>
          )}

          {loadingReseller && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Verificando indicação...</span>
            </div>
          )}

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo do estabelecimento (opcional)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" size="sm" className="w-full cursor-pointer" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Enviar logo
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Establishment Name */}
                <div className="space-y-2">
                  <Label htmlFor="establishmentName">Nome do estabelecimento *</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="establishmentName"
                      name="establishmentName"
                      type="text"
                      placeholder="Ex: Lanchonete do João"
                      value={formData.establishmentName}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Sua cidade"
                      value={formData.city}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* CPF/CNPJ */}
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="cpfCnpj"
                      name="cpfCnpj"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpfCnpj}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (para receber pedidos) *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite a senha novamente"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
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
                      Criando conta...
                    </>
                  ) : (
                    'Criar minha conta grátis'
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos termos de uso e política de privacidade.
                </p>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem conta?{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Fazer login
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
