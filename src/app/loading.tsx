import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="app-container min-h-screen py-8">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
