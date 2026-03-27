import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="p-6">
      <Skeleton className="h-8 w-56" />

      <div className="mt-8 space-y-10">
        <section>
          <div className="mb-4 flex gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <Skeleton className="h-6 w-60" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <Skeleton className="h-6 w-64" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-1/2" />
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-4 h-10 w-56" />
            <Skeleton className="mt-3 h-9 w-36" />
          </div>
        </section>
      </div>
    </div>
  );
}
