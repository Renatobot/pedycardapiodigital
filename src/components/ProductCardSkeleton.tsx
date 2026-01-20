import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductCardSkeletonGrid() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="w-full aspect-square" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center justify-between mt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
