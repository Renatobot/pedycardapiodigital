import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Loader2, Star, MessageSquare } from 'lucide-react';
import { useOrderReviews } from '@/hooks/useOrderReviews';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EstablishmentReviewsProps {
  establishmentId: string;
}

export default function EstablishmentReviews({
  establishmentId,
}: EstablishmentReviewsProps) {
  const { reviews, loading, stats, fetchReviews } = useOrderReviews(establishmentId);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            Resumo das Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalReviews === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma avaliação recebida ainda
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Average Rating */}
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
                <span className="text-4xl font-bold text-primary">
                  {stats.averageRating.toFixed(1)}
                </span>
                <StarRating value={Math.round(stats.averageRating)} readOnly size="sm" />
                <span className="text-sm text-muted-foreground mt-1">
                  {stats.totalReviews} avaliação{stats.totalReviews !== 1 ? 'ões' : ''}
                </span>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution];
                  const percentage = stats.totalReviews > 0 
                    ? (count / stats.totalReviews) * 100 
                    : 0;

                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-3 text-sm font-medium">{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="w-8 text-xs text-muted-foreground text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            Comentários Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum comentário ainda
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} readOnly size="sm" />
                        <span className="font-medium text-sm">
                          {review.customer_name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground pl-1">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
