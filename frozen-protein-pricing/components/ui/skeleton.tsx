import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantClasses = {
    default: 'h-4 w-full',
    card: 'h-32 w-full rounded-lg',
    text: 'h-4 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-md',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b">
      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
      <td className="p-4"><Skeleton className="h-4 w-16" /></td>
      <td className="p-4"><Skeleton className="h-4 w-12" /></td>
    </tr>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-4 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-24" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-12" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
