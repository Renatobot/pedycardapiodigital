import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showValue?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 'md',
  readOnly = false,
  showValue = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readOnly}
          className={cn(
            'transition-transform focus:outline-none',
            !readOnly && 'hover:scale-110 cursor-pointer',
            readOnly && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors',
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground'
            )}
          />
        </button>
      ))}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
