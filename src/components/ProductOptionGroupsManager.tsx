import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  GripVertical,
  Settings2,
  X,
  Sparkles,
  Lock
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  checkFeatureAccess, 
  PRO_PLUS_FEATURES, 
  requiresProPlusForFlavors,
  EstablishmentForGating 
} from '@/lib/featureGating';
import { ProPlusLockBadge } from './ProPlusLockBadge';
import { NICHE_TEMPLATES, suggestTemplateForCategory, NicheTemplate, OptionGroupTemplate } from '@/lib/nicheTemplates';
import { formatCurrency } from '@/lib/whatsapp';

export interface ProductOption {
  id: string;
  name: string;
  price: number;
  is_default: boolean;
  is_available: boolean;
  sort_order: number;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple' | 'flavor';
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  sort_order: number;
  options: ProductOption[];
}

interface ProductOptionGroupsManagerProps {
  productId: string;
  establishment: EstablishmentForGating | null;
  categoryName?: string;
  onGroupsChange?: (groups: ProductOptionGroup[]) => void;
}

export function ProductOptionGroupsManager({
  productId,
  establishment,
  categoryName,
  onGroupsChange
}: ProductOptionGroupsManagerProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<ProductOptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [suggestedTemplate, setSuggestedTemplate] = useState<NicheTemplate | null>(null);

  // Check Pro+ access
  const proPlusAccess = checkFeatureAccess(establishment, PRO_PLUS_FEATURES.PIZZA_3_4_FLAVORS);
  const canUseFlavors3Plus = proPlusAccess.hasAccess;

  // Fetch existing option groups
  useEffect(() => {
    if (productId && !productId.startsWith('temp-')) {
      fetchGroups();
    } else {
      setLoading(false);
    }
  }, [productId]);

  // Suggest template based on category
  useEffect(() => {
    if (categoryName) {
      const template = suggestTemplateForCategory(categoryName);
      setSuggestedTemplate(template);
    }
  }, [categoryName]);

  const fetchGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('product_option_groups')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      if (groupsError) throw groupsError;

      if (groupsData && groupsData.length > 0) {
        const groupIds = groupsData.map(g => g.id);
        const { data: optionsData, error: optionsError } = await supabase
          .from('product_options')
          .select('*')
          .in('option_group_id', groupIds)
          .order('sort_order', { ascending: true });

        if (optionsError) throw optionsError;

        const groupsWithOptions = groupsData.map(group => ({
          ...group,
          type: group.type as 'single' | 'multiple' | 'flavor',
          options: (optionsData || [])
            .filter(opt => opt.option_group_id === group.id)
            .map(opt => ({
              ...opt,
              price: Number(opt.price)
            }))
        }));

        setGroups(groupsWithOptions);
        onGroupsChange?.(groupsWithOptions);
      }
    } catch (error) {
      console.error('Error fetching option groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGroup = () => {
    const newGroup: ProductOptionGroup = {
      id: `temp-group-${Date.now()}`,
      name: '',
      type: 'single',
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      sort_order: groups.length,
      options: []
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    setExpandedGroups(prev => new Set([...prev, newGroup.id]));
    onGroupsChange?.(updated);
  };

  const removeGroup = (groupId: string) => {
    const updated = groups.filter(g => g.id !== groupId);
    setGroups(updated);
    onGroupsChange?.(updated);
  };

  const updateGroup = (groupId: string, updates: Partial<ProductOptionGroup>) => {
    const updated = groups.map(g => 
      g.id === groupId ? { ...g, ...updates } : g
    );
    setGroups(updated);
    onGroupsChange?.(updated);
  };

  const addOption = (groupId: string) => {
    const newOption: ProductOption = {
      id: `temp-opt-${Date.now()}`,
      name: '',
      price: 0,
      is_default: false,
      is_available: true,
      sort_order: 0
    };
    
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: [...g.options, { ...newOption, sort_order: g.options.length }]
        };
      }
      return g;
    });
    setGroups(updated);
    onGroupsChange?.(updated);
  };

  const removeOption = (groupId: string, optionId: string) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.filter(o => o.id !== optionId)
        };
      }
      return g;
    });
    setGroups(updated);
    onGroupsChange?.(updated);
  };

  const updateOption = (groupId: string, optionId: string, updates: Partial<ProductOption>) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.map(o => 
            o.id === optionId ? { ...o, ...updates } : o
          )
        };
      }
      return g;
    });
    setGroups(updated);
    onGroupsChange?.(updated);
  };

  const applyTemplate = (template: NicheTemplate) => {
    const newGroups: ProductOptionGroup[] = template.groups.map((tg, index) => ({
      id: `temp-group-${Date.now()}-${index}`,
      name: tg.name,
      type: tg.type,
      is_required: tg.isRequired || false,
      min_selections: tg.minSelections || 0,
      max_selections: tg.maxSelections || 1,
      sort_order: index,
      options: (tg.options || []).map((opt, optIndex) => ({
        id: `temp-opt-${Date.now()}-${index}-${optIndex}`,
        name: opt.name,
        price: opt.pricePerOption || 0,
        is_default: false,
        is_available: true,
        sort_order: optIndex
      }))
    }));

    setGroups([...groups, ...newGroups]);
    onGroupsChange?.([...groups, ...newGroups]);
    toast({
      title: "Template aplicado!",
      description: `${newGroups.length} grupos de opções adicionados.`
    });
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return 'Escolha única';
      case 'multiple': return 'Múltipla escolha';
      case 'flavor': return 'Sabores';
      default: return type;
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando opções...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Personalização do Produto</Label>
          <p className="text-xs text-muted-foreground">
            Configure opções que o cliente poderá escolher. Opções desabilitadas não aparecem no cardápio.
          </p>
        </div>
      </div>

      {/* Template Suggestion */}
      {suggestedTemplate && groups.length === 0 && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Usar template "{suggestedTemplate.name}"?
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => applyTemplate(suggestedTemplate)}>
                Aplicar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {suggestedTemplate.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Existing Groups */}
      {groups.map((group, groupIndex) => (
        <Collapsible 
          key={group.id} 
          open={expandedGroups.has(group.id)}
          onOpenChange={() => toggleGroupExpanded(group.id)}
        >
          <Card>
            <CardHeader className="p-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium text-sm">
                        {group.name || 'Novo grupo'}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(group.type)}
                        </Badge>
                        {group.is_required && (
                          <Badge variant="secondary" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {group.options.length} opções
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGroup(group.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {expandedGroups.has(group.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent className="p-3 pt-0 space-y-3">
                {/* Group Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome do grupo</Label>
                    <Input
                      placeholder="Ex: Tipo de Pão"
                      value={group.name}
                      onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de seleção</Label>
                    <Select
                      value={group.type}
                      onValueChange={(value: 'single' | 'multiple' | 'flavor') => 
                        updateGroup(group.id, { type: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Escolha única</SelectItem>
                        <SelectItem value="multiple">Múltipla escolha</SelectItem>
                        <SelectItem value="flavor">Sabores (pizza)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`required-${group.id}`}
                      checked={group.is_required}
                      onCheckedChange={(checked) => 
                        updateGroup(group.id, { is_required: !!checked })
                      }
                    />
                    <Label htmlFor={`required-${group.id}`} className="text-xs cursor-pointer">
                      Obrigatório
                    </Label>
                  </div>

                  {group.type === 'multiple' && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Máx:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={group.max_selections}
                        onChange={(e) => updateGroup(group.id, { 
                          max_selections: parseInt(e.target.value) || 1 
                        })}
                        className="h-7 w-16 text-xs"
                      />
                    </div>
                  )}

                  {group.type === 'flavor' && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Máx sabores:</Label>
                      <Select
                        value={group.max_selections.toString()}
                        onValueChange={(value) => {
                          const maxFlavors = parseInt(value);
                          if (requiresProPlusForFlavors(maxFlavors) && !canUseFlavors3Plus) {
                            return; // Block if trying to set > 2 without Pro+
                          }
                          updateGroup(group.id, { max_selections: maxFlavors });
                        }}
                      >
                        <SelectTrigger className="h-7 w-20 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3" disabled={!canUseFlavors3Plus}>
                            <span className="flex items-center gap-1">
                              3 {!canUseFlavors3Plus && <Lock className="w-3 h-3" />}
                            </span>
                          </SelectItem>
                          <SelectItem value="4" disabled={!canUseFlavors3Plus}>
                            <span className="flex items-center gap-1">
                              4 {!canUseFlavors3Plus && <Lock className="w-3 h-3" />}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {!canUseFlavors3Plus && (
                        <ProPlusLockBadge feature={PRO_PLUS_FEATURES.PIZZA_3_4_FLAVORS} />
                      )}
                    </div>
                  )}
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  <Label className="text-xs">Opções</Label>
                  {group.options.map((option, optIndex) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Input
                        placeholder="Nome da opção"
                        value={option.name}
                        onChange={(e) => updateOption(group.id, option.id, { name: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={option.price || ''}
                          onChange={(e) => updateOption(group.id, option.id, { 
                            price: parseFloat(e.target.value) || 0 
                          })}
                          className="h-8 w-20 text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeOption(group.id, option.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => addOption(group.id)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar opção
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      {/* Add Group Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addGroup}
      >
        <Plus className="w-4 h-4 mr-1" />
        Adicionar grupo de opções
      </Button>

      {/* Quick Templates */}
      {groups.length === 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Ou use um template:</Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(NICHE_TEMPLATES).slice(0, 4).map(template => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => applyTemplate(template)}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductOptionGroupsManager;
