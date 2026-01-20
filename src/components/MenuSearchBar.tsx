import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MenuSearchBarProps {
  onSearch: (term: string) => void;
  className?: string;
}

export function MenuSearchBar({ onSearch, className }: MenuSearchBarProps) {
  const [value, setValue] = useState('');

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input 
        type="text"
        placeholder="Buscar produtos..." 
        className="pl-10 pr-10 bg-background"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
