import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Skeleton */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg bg-slate-700" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-slate-700" />
              <Skeleton className="h-3 w-48 bg-slate-700" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-md bg-slate-700" />
            <Skeleton className="h-9 w-20 rounded-md bg-slate-700" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-72 rounded-lg bg-slate-800" />

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg bg-slate-700" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-12 bg-slate-700" />
                    <Skeleton className="h-4 w-20 bg-slate-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48 bg-slate-700" />
            <Skeleton className="h-4 w-72 bg-slate-700" />
          </CardHeader>
          <CardContent>
            {/* Search/Filter Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Skeleton className="h-10 flex-1 rounded-md bg-slate-700" />
              <Skeleton className="h-10 w-48 rounded-md bg-slate-700" />
            </div>

            {/* Table Rows Skeleton */}
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-slate-700/30">
                  <Skeleton className="w-10 h-10 rounded-full bg-slate-600" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 bg-slate-600" />
                    <Skeleton className="h-3 w-32 bg-slate-600" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full bg-slate-600" />
                  <Skeleton className="h-6 w-16 rounded-full bg-slate-600" />
                  <Skeleton className="h-4 w-24 bg-slate-600" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md bg-slate-600" />
                    <Skeleton className="h-8 w-8 rounded-md bg-slate-600" />
                    <Skeleton className="h-8 w-8 rounded-md bg-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
