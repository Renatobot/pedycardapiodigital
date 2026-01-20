import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star } from 'lucide-react';
import StarRating from './StarRating';
import { useOrderReviews } from '@/hooks/useOrderReviews';

interface OrderReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  establishmentId: string;
  customerId?: string;
  onSuccess?: () => void;
}

export default function OrderReviewModal({
  open,
  onOpenChange,
  orderId,
  establishmentId,
  customerId,
  onSuccess,
}: OrderReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { submitReview } = useOrderReviews();

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    const success = await submitReview(
      orderId,
      establishmentId,
      rating,
      comment,
      customerId
    );

    setSubmitting(false);

    if (success) {
      setRating(0);
      setComment('');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            Avaliar Pedido
          </DialogTitle>
          <DialogDescription>
            Como foi sua experiência com este pedido?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Toque nas estrelas para avaliar</p>
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
            />
            {rating > 0 && (
              <p className="text-sm font-medium text-primary">
                {rating === 1 && 'Muito ruim'}
                {rating === 2 && 'Ruim'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bom'}
                {rating === 5 && 'Excelente!'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Deixe um comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte como foi sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Avaliação'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
