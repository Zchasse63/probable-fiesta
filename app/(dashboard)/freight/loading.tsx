import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';

export default function FreightLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <Skeleton className="h-6 w-40" />
        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}
