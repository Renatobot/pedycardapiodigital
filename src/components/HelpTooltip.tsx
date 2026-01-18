import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpTooltipProps {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function HelpTooltip({ children, side = 'right', className }: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className={`inline-flex items-center justify-center ${className}`}>
            <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side={side}>
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ProductOptionsHelpContent() {
  return (
    <div className="space-y-3">
      <p className="font-medium text-foreground">
        Aqui você define as escolhas que o cliente pode fazer neste produto.
      </p>
      <p className="text-sm text-muted-foreground">
        Você pode ativar ou desativar grupos como pão, ponto da carne, massa, molho ou adicionais.
        Se não quiser que o cliente escolha nada, basta não adicionar grupos.
      </p>
      <div className="border-t border-border pt-2 space-y-2">
        <p className="text-xs font-medium">Exemplos:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>Hambúrguer:</strong> pão (obrigatório, única), ponto da carne (obrigatório, única), extras (opcional, múltipla)</li>
          <li>• <strong>Massa:</strong> tipo de massa (obrigatório), molho (obrigatório), extras (opcional)</li>
          <li>• <strong>Marmita:</strong> proteína (obrigatório), acompanhamentos (opcional)</li>
        </ul>
      </div>
    </div>
  );
}

export default HelpTooltip;
