import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, RefreshCw, Calendar, Archive, Loader2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

interface Establishment {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cpf_cnpj: string;
  plan_status: string;
  plan_expires_at: string | null;
  trial_end_date: string;
  has_pro_plus: boolean;
}

interface AdminQuickActionsProps {
  establishments: Establishment[];
  onRefresh: () => Promise<void>;
  lastUpdate: Date | null;
}

const BACKUP_TABLES = [
  { name: 'establishments', label: 'Estabelecimentos' },
  { name: 'categories', label: 'Categorias' },
  { name: 'products', label: 'Produtos' },
  { name: 'product_additions', label: 'Adicionais' },
  { name: 'product_option_groups', label: 'Grupos de Opções' },
  { name: 'product_options', label: 'Opções' },
  { name: 'orders', label: 'Pedidos' },
  { name: 'customers', label: 'Clientes' },
  { name: 'customer_addresses', label: 'Endereços de Clientes' },
  { name: 'resellers', label: 'Revendedores' },
  { name: 'reseller_activations', label: 'Ativações de Revendedores' },
  { name: 'delivery_zones', label: 'Zonas de Entrega' },
  { name: 'discount_codes', label: 'Cupons de Desconto' },
  { name: 'business_hours', label: 'Horários de Funcionamento' },
  { name: 'automatic_promotions', label: 'Promoções Automáticas' },
  { name: 'establishment_referrals', label: 'Indicações' },
];

function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export function AdminQuickActions({ establishments, onRefresh, lastUpdate }: AdminQuickActionsProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // Calculate trials expiring soon (within 3 days)
  const expiringTrials = establishments.filter(est => {
    if (est.plan_status !== 'trial') return false;
    const daysLeft = differenceInDays(new Date(est.trial_end_date), new Date());
    return daysLeft >= 0 && daysLeft <= 3;
  });

  // Calculate active plans expiring soon (within 7 days)
  const expiringPlans = establishments.filter(est => {
    if (est.plan_status !== 'active' || !est.plan_expires_at) return false;
    const daysLeft = differenceInDays(new Date(est.plan_expires_at), new Date());
    return daysLeft >= 0 && daysLeft <= 7;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: 'Dados atualizados!',
        description: 'Lista de estabelecimentos atualizada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar os dados.',
        variant: 'destructive',
      });
    }
    setIsRefreshing(false);
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'WhatsApp', 'CPF/CNPJ', 'Status', 'Pro+', 'Expiração'];
    const rows = establishments.map(est => [
      est.name,
      est.email,
      est.whatsapp,
      est.cpf_cnpj,
      est.plan_status,
      est.has_pro_plus ? 'Sim' : 'Não',
      est.plan_status === 'trial' 
        ? est.trial_end_date 
        : est.plan_expires_at || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estabelecimentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Exportação concluída!',
      description: `${establishments.length} estabelecimentos exportados.`,
    });
  };

  const exportFullBackup = async () => {
    setIsExportingBackup(true);
    
    try {
      const zip = new JSZip();
      const dateStr = new Date().toISOString().split('T')[0];
      const folder = zip.folder(`backup_pedy_${dateStr}`);
      
      if (!folder) {
        throw new Error('Erro ao criar pasta do backup');
      }

      let totalRecords = 0;
      const results: { table: string; count: number }[] = [];

      for (const table of BACKUP_TABLES) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase as any)
            .from(table.name)
            .select('*')
            .limit(10000);

          if (error) {
            console.warn(`Erro ao exportar ${table.name}:`, error.message);
            results.push({ table: table.label, count: 0 });
            continue;
          }

          if (data && data.length > 0) {
            const csv = convertToCSV(data as Record<string, unknown>[]);
            folder.file(`${table.name}.csv`, csv);
            totalRecords += data.length;
            results.push({ table: table.label, count: data.length });
          } else {
            folder.file(`${table.name}.csv`, '');
            results.push({ table: table.label, count: 0 });
          }
        } catch (err) {
          console.warn(`Erro ao processar ${table.name}:`, err);
          results.push({ table: table.label, count: 0 });
        }
      }

      // Generate summary file
      const summary = [
        `Backup PEDY - ${dateStr}`,
        `Total de registros: ${totalRecords}`,
        '',
        'Detalhes por tabela:',
        ...results.map(r => `- ${r.table}: ${r.count} registros`)
      ].join('\n');
      
      folder.file('_resumo.txt', summary);

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `backup_pedy_${dateStr}.zip`;
      link.click();

      toast({
        title: 'Backup completo!',
        description: `${totalRecords} registros exportados de ${BACKUP_TABLES.length} tabelas.`,
      });
    } catch (error) {
      console.error('Erro ao gerar backup:', error);
      toast({
        title: 'Erro no backup',
        description: 'Não foi possível gerar o backup completo.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingBackup(false);
    }
  };

  const totalAlerts = expiringTrials.length + expiringPlans.length;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        {/* Alerts Section */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {expiringTrials.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm text-amber-300">
                <strong>{expiringTrials.length}</strong> <span className="hidden sm:inline">{expiringTrials.length === 1 ? 'trial expira' : 'trials expiram'} em até 3 dias</span><span className="sm:hidden">trials</span>
              </span>
            </div>
          )}
          
          {expiringPlans.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-xs sm:text-sm text-orange-300">
                <strong>{expiringPlans.length}</strong> <span className="hidden sm:inline">{expiringPlans.length === 1 ? 'plano vence' : 'planos vencem'} em até 7 dias</span><span className="sm:hidden">planos</span>
              </span>
            </div>
          )}

          {totalAlerts === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="text-xs sm:text-sm text-green-300">
                ✓ <span className="hidden sm:inline">Nenhum alerta no momento</span><span className="sm:hidden">OK</span>
              </span>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-2 sm:pt-0 border-t border-slate-700 sm:border-t-0">
          {lastUpdate && (
            <span className="text-xs text-slate-500 hidden sm:block">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportFullBackup}
            disabled={isExportingBackup}
            className="border-emerald-600 text-emerald-300 hover:bg-emerald-700/30 flex-1 sm:flex-none"
          >
            {isExportingBackup ? (
              <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
            ) : (
              <Archive className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{isExportingBackup ? 'Gerando...' : 'Backup Completo'}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-4 h-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
