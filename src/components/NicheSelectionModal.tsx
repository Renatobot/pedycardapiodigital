import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, FileText } from 'lucide-react';
import { MENU_TEMPLATES, MenuTemplate } from '@/lib/menuTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NicheSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  onComplete: () => void;
}

export function NicheSelectionModal({
  open,
  onOpenChange,
  establishmentId,
  onComplete,
}: NicheSelectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  const handleSelectNiche = async (template: MenuTemplate) => {
    setSelectedNiche(template.id);
    setLoading(true);

    try {
      // Criar categorias e produtos baseado no template
      for (let categoryIndex = 0; categoryIndex < template.categories.length; categoryIndex++) {
        const category = template.categories[categoryIndex];
        
        // Criar categoria
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: category.name,
            establishment_id: establishmentId,
            sort_order: categoryIndex,
          })
          .select()
          .single();

        if (categoryError) {
          console.error('Erro ao criar categoria:', categoryError);
          continue;
        }

        // Criar produtos da categoria
        for (const product of category.products) {
          const { error: productError } = await supabase
            .from('products')
            .insert({
              name: product.name,
              description: product.description,
              price: product.price,
              category_id: categoryData.id,
              establishment_id: establishmentId,
              available: true,
            });

          if (productError) {
            console.error('Erro ao criar produto:', productError);
          }
        }
      }

      toast.success(`Cardápio de ${template.name} criado com sucesso!`, {
        description: 'Agora você pode personalizar os produtos com suas fotos e preços.',
      });
      
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar cardápio:', error);
      toast.error('Erro ao criar cardápio. Tente novamente.');
    } finally {
      setLoading(false);
      setSelectedNiche(null);
    }
  };

  const handleStartFromScratch = () => {
    toast.info('Você pode criar suas categorias e produtos do zero!');
    onComplete();
    onOpenChange(false);
  };

  const templates = Object.values(MENU_TEMPLATES);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Bem-vindo! Escolha o tipo do seu negócio
          </DialogTitle>
          <DialogDescription>
            Vamos criar um cardápio inicial para você começar rapidamente.
            Você poderá personalizar tudo depois!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                selectedNiche === template.id ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
              onClick={() => !loading && handleSelectNiche(template)}
            >
              <CardContent className="p-4 text-center">
                {loading && selectedNiche === template.id ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                ) : (
                  <span className="text-3xl mb-2 block">{template.icon}</span>
                )}
                <h3 className="font-medium text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {template.categories.length} categorias • {' '}
                  {template.categories.reduce((acc, cat) => acc + cat.products.length, 0)} produtos
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleStartFromScratch}
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Começar do zero (criar manualmente)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
