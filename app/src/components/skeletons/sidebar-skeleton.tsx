import { Skeleton } from "../ui/skeleton";

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* User section */}
      <div className="flex items-center space-x-3 p-3 border rounded-lg">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Smart Lists */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded-lg">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-5 rounded-full ml-auto" />
          </div>
        ))}
      </div>

      {/* Productivity Tools */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded-lg">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Custom Lists */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded-lg">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-5 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}