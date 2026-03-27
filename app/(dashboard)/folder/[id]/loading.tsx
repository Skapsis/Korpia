import { Skeleton } from "@/components/ui/Skeleton";

export default function FolderLoading() {
  return (
    <div className="p-6">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-8 h-14 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
