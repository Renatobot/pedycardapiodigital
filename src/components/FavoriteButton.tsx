import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
}

export function FavoriteButton({ isFavorite, onToggle, className }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "p-2 rounded-full",
        "bg-white/90 dark:bg-card/90 backdrop-blur shadow-sm",
        "transition-all hover:scale-110 active:scale-95",
        className
      )}
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-all",
          isFavorite
            ? "fill-red-500 text-red-500 animate-heart-beat"
            : "text-muted-foreground hover:text-red-400"
        )}
      />
    </button>
  );
}
