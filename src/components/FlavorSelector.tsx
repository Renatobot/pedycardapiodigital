import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/whatsapp';

interface Flavor {
  id: string;
  name: string;
  price: number;
}

interface FlavorSelectorProps {
  flavors: Flavor[];
  maxFlavors: number;
  priceRule: 'highest' | 'average' | 'sum' | 'custom';
  selectedFlavors: Flavor[];
  onSelectionChange: (flavors: Flavor[]) => void;
}

export function FlavorSelector({
  flavors,
  maxFlavors,
  priceRule,
  selectedFlavors,
  onSelectionChange
}: FlavorSelectorProps) {

  const toggleFlavor = (flavor: Flavor) => {
    const isSelected = selectedFlavors.some(f => f.id === flavor.id);
    
    if (isSelected) {
      onSelectionChange(selectedFlavors.filter(f => f.id !== flavor.id));
    } else {
      if (selectedFlavors.length < maxFlavors) {
        onSelectionChange([...selectedFlavors, flavor]);
      }
    }
  };

  const removeFlavor = (flavorId: string) => {
    onSelectionChange(selectedFlavors.filter(f => f.id !== flavorId));
  };

  const calculatePrice = (): number => {
    if (selectedFlavors.length === 0) return 0;

    switch (priceRule) {
      case 'highest':
        return Math.max(...selectedFlavors.map(f => f.price));
      case 'average':
        const sum = selectedFlavors.reduce((acc, f) => acc + f.price, 0);
        return sum / selectedFlavors.length;
      case 'sum':
        return selectedFlavors.reduce((acc, f) => acc + f.price, 0);
      default:
        return Math.max(...selectedFlavors.map(f => f.price));
    }
  };

  const getPriceRuleLabel = (): string => {
    switch (priceRule) {
      case 'highest':
        return 'Valor do sabor mais caro';
      case 'average':
        return 'Média dos valores';
      case 'sum':
        return 'Soma dos valores';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-foreground">
          Escolha até {maxFlavors} {maxFlavors === 1 ? 'sabor' : 'sabores'}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Badge variant="outline" className="text-xs">
          {selectedFlavors.length}/{maxFlavors}
        </Badge>
      </div>

      {/* Selected Flavors */}
      {selectedFlavors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFlavors.map(flavor => (
            <Badge 
              key={flavor.id}
              variant="secondary"
              className="gap-1 pl-3 pr-1 py-1"
            >
              {flavor.name}
              <button
                onClick={() => removeFlavor(flavor.id)}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Flavors Grid */}
      <div className="grid grid-cols-2 gap-2">
        {flavors.map(flavor => {
          const isSelected = selectedFlavors.some(f => f.id === flavor.id);
          const isDisabled = !isSelected && selectedFlavors.length >= maxFlavors;

          return (
            <button
              key={flavor.id}
              onClick={() => toggleFlavor(flavor)}
              disabled={isDisabled}
              className={`
                p-3 rounded-lg text-left transition-all
                ${isSelected 
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary' 
                  : 'bg-muted hover:bg-muted/80'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{flavor.name}</span>
                {isSelected && (
                  <Check className="w-4 h-4" />
                )}
              </div>
              <span className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {formatCurrency(flavor.price)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Price Info */}
      {selectedFlavors.length > 0 && maxFlavors > 1 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {getPriceRuleLabel()}
            </span>
            <span className="font-semibold text-primary">
              {formatCurrency(calculatePrice())}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlavorSelector;
