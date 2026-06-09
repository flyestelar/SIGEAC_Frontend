import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6 p-5">
      {/* Top bar / header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Context strip skeleton */}
      <div className="flex items-center gap-3 px-5 py-2.5">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-52" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Main area */}
        <div className="space-y-4 lg:col-span-8">
          <div className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 gap-x-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          </div>
          <div className="p-5">
            <Skeleton className="mb-4 h-4 w-40" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-full max-w-[280px]" />
                    <Skeleton className="h-3 w-full max-w-[180px]" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4 lg:col-span-4">
          <div className="p-5">
            <Skeleton className="mb-4 h-4 w-28" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-[240px] w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
