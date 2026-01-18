import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { X, Lightbulb } from 'lucide-react';

interface OnboardingTooltipProps {
  id: string;
  title: string;
  message: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  showOnce?: boolean;
  forceShow?: boolean;
}

const STORAGE_KEY = 'pedy_onboarding_seen';

function getSeenTooltips(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markTooltipAsSeen(id: string) {
  const seen = getSeenTooltips();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  }
}

function hasSeenTooltip(id: string): boolean {
  return getSeenTooltips().includes(id);
}

export function OnboardingTooltip({
  id,
  title,
  message,
  children,
  side = 'top',
  showOnce = true,
  forceShow = false,
}: OnboardingTooltipProps) {
  const [open, setOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Verificar se deve mostrar o tooltip
    if (forceShow) {
      setShouldShow(true);
      setOpen(true);
    } else if (showOnce && !hasSeenTooltip(id)) {
      setShouldShow(true);
      // Pequeno delay para o tooltip aparecer após o render
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    } else if (!showOnce) {
      setShouldShow(true);
    }
  }, [id, showOnce, forceShow]);

  const handleDismiss = () => {
    setOpen(false);
    if (showOnce) {
      markTooltipAsSeen(id);
    }
  };

  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        className="w-72 p-0 border-primary/20 shadow-lg"
        onPointerDownOutside={handleDismiss}
      >
        <div className="bg-primary/5 p-3 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{message}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-background"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Componente para dicas que aparecem ao passar o mouse
export function HoverTip({
  message,
  children,
  side = 'top',
}: {
  message: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="cursor-help">{children}</span>
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        className="w-60 p-2 text-xs text-muted-foreground"
      >
        <div className="flex items-start gap-2">
          <Lightbulb className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Utilitário para resetar todos os tooltips (útil para testes)
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}

// Constantes com os IDs e mensagens dos tooltips
export const ONBOARDING_TIPS = {
  PRODUCT_IMAGE: {
    id: 'product_image',
    title: 'Foto do Produto',
    message: 'Envie uma foto real e atrativa! Uma boa imagem pode aumentar suas vendas em até 30%.',
  },
  PRODUCT_NAME: {
    id: 'product_name',
    title: 'Nome Chamativo',
    message: 'Use nomes que chamem atenção! Ex: "X-Bacon Especial da Casa" ao invés de apenas "Lanche".',
  },
  PRODUCT_DESCRIPTION: {
    id: 'product_description',
    title: 'Descrição Completa',
    message: 'Liste os ingredientes e diferenciais. Isso ajuda o cliente a decidir e evita dúvidas!',
  },
  PRODUCT_PRICE: {
    id: 'product_price',
    title: 'Preço Competitivo',
    message: 'Defina um preço justo. Pesquise a concorrência da sua região para se manter competitivo.',
  },
  PRODUCT_OPTIONS: {
    id: 'product_options',
    title: 'Personalização',
    message: 'Configure opções como tipo de pão, ponto da carne, etc. Disponível no Plano Pro+.',
  },
  FIRST_CATEGORY: {
    id: 'first_category',
    title: 'Organize seu Cardápio',
    message: 'Crie categorias para organizar seus produtos. Ex: "Lanches", "Bebidas", "Sobremesas".',
  },
  MENU_LINK: {
    id: 'menu_link',
    title: 'Link do Cardápio',
    message: 'Copie este link e divulgue nas suas redes sociais e WhatsApp!',
  },
  QR_CODE: {
    id: 'qr_code',
    title: 'QR Code',
    message: 'Imprima o QR Code e coloque no balcão, mesas ou embalagens para facilitar o acesso dos clientes.',
  },
  ADDITIONS: {
    id: 'additions',
    title: 'Adicionais',
    message: 'Configure itens extras como bacon, queijo extra, etc. O cliente pode adicionar no pedido.',
  },
} as const;
