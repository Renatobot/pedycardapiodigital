import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/whatsapp';
import { ProductOptionGroup, ProductOption } from './ProductOptionGroupsManager';

interface SelectedOption {
  groupId: string;
  groupName: string;
  options: { id: string; name: string; price: number }[];
}

interface ProductOptionSelectorProps {
  groups: ProductOptionGroup[];
  selectedOptions: SelectedOption[];
  onSelectionChange: (selections: SelectedOption[]) => void;
}

export function ProductOptionSelector({
  groups,
  selectedOptions,
  onSelectionChange
}: ProductOptionSelectorProps) {
  
  const handleSingleSelect = (group: ProductOptionGroup, optionId: string) => {
    const option = group.options.find(o => o.id === optionId);
    if (!option) return;

    const updated = selectedOptions.filter(s => s.groupId !== group.id);
    updated.push({
      groupId: group.id,
      groupName: group.name,
      options: [{ id: option.id, name: option.name, price: option.price }]
    });
    onSelectionChange(updated);
  };

  const handleMultipleSelect = (group: ProductOptionGroup, optionId: string, checked: boolean) => {
    const option = group.options.find(o => o.id === optionId);
    if (!option) return;

    const existing = selectedOptions.find(s => s.groupId === group.id);
    let newOptions = existing?.options || [];

    if (checked) {
      // Check max selections
      if (newOptions.length >= group.max_selections) {
        return;
      }
      newOptions = [...newOptions, { id: option.id, name: option.name, price: option.price }];
    } else {
      newOptions = newOptions.filter(o => o.id !== optionId);
    }

    const updated = selectedOptions.filter(s => s.groupId !== group.id);
    if (newOptions.length > 0) {
      updated.push({
        groupId: group.id,
        groupName: group.name,
        options: newOptions
      });
    }
    onSelectionChange(updated);
  };

  const isOptionSelected = (groupId: string, optionId: string) => {
    const selection = selectedOptions.find(s => s.groupId === groupId);
    return selection?.options.some(o => o.id === optionId) || false;
  };

  const getSelectedCount = (groupId: string) => {
    const selection = selectedOptions.find(s => s.groupId === groupId);
    return selection?.options.length || 0;
  };

  const validateGroup = (group: ProductOptionGroup): { valid: boolean; message?: string } => {
    const selectedCount = getSelectedCount(group.id);
    
    if (group.is_required && selectedCount === 0) {
      return { valid: false, message: 'Obrigatório' };
    }
    
    if (group.min_selections > 0 && selectedCount < group.min_selections) {
      return { valid: false, message: `Selecione pelo menos ${group.min_selections}` };
    }
    
    return { valid: true };
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {groups.map(group => {
        const validation = validateGroup(group);
        const selectedCount = getSelectedCount(group.id);

        return (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-foreground">
                {group.name}
                {group.is_required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                {group.type === 'multiple' && (
                  <Badge variant="outline" className="text-xs">
                    {selectedCount}/{group.max_selections}
                  </Badge>
                )}
                {!validation.valid && (
                  <Badge variant="destructive" className="text-xs">
                    {validation.message}
                  </Badge>
                )}
              </div>
            </div>

            {group.type === 'single' ? (
              <RadioGroup
                value={selectedOptions.find(s => s.groupId === group.id)?.options[0]?.id || ''}
                onValueChange={(value) => handleSingleSelect(group, value)}
              >
                <div className="space-y-2">
                  {group.options.filter(o => o.is_available).map(option => (
                    <div 
                      key={option.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="cursor-pointer">
                          {option.name}
                        </Label>
                      </div>
                      {option.price > 0 && (
                        <span className="text-sm font-medium text-secondary">
                          +{formatCurrency(option.price)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                {group.options.filter(o => o.is_available).map(option => {
                  const isSelected = isOptionSelected(group.id, option.id);
                  const isDisabled = !isSelected && selectedCount >= group.max_selections;

                  return (
                    <div 
                      key={option.id}
                      className={`flex items-center justify-between p-3 bg-muted rounded-lg ${
                        isDisabled ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={option.id}
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => 
                            handleMultipleSelect(group, option.id, !!checked)
                          }
                        />
                        <Label 
                          htmlFor={option.id} 
                          className={`cursor-pointer ${isDisabled ? 'cursor-not-allowed' : ''}`}
                        >
                          {option.name}
                        </Label>
                      </div>
                      {option.price > 0 && (
                        <span className="text-sm font-medium text-secondary">
                          +{formatCurrency(option.price)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ProductOptionSelector;
