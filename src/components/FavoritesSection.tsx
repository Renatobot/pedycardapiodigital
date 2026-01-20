import { Heart, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/whatsapp';
import { Product } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface FavoritesSectionProps {
  favorites: string[];
  products: Product[];
  onProductClick: (product: Product) => void;
  onClearFavorites: () => void;
}

export function FavoritesSection({
  favorites,
  products,
  onProductClick,
  onClearFavorites,
}: FavoritesSectionProps) {
  const favoriteProducts = products.filter((p) => favorites.includes(p.id) && p.available);

  if (favoriteProducts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          Meus Favoritos ({favoriteProducts.length})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFavorites}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {favoriteProducts.map((product) => {
            const effectivePrice =
              product.is_promotional && product.promotional_price
                ? product.promotional_price
                : product.price;

            return (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 w-[140px] overflow-hidden"
                onClick={() => onProductClick(product)}
              >
                <CardContent className="p-0">
                  <div className="w-full h-24 bg-muted flex items-center justify-center overflow-hidden relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">🍽️</span>
                    )}
                    <div className="absolute top-1 right-1">
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="font-medium text-sm text-foreground line-clamp-1 whitespace-normal">
                      {product.name}
                    </p>
                    <p className="font-bold text-primary text-sm mt-0.5">
                      {formatCurrency(effectivePrice)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
