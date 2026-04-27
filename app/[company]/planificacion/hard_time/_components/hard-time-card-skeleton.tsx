'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function HardTimeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
      <div className="space-y-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <Skeleton className="mt-0.5 h-6 w-6 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>

      <div className="space-y-3 px-4 pb-4 pt-0">
        <Skeleton className="h-8 w-full rounded-md" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HardTimeCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <HardTimeCardSkeleton key={i} />
      ))}
    </div>
  );
}
