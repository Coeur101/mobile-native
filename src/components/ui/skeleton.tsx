interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div
    className={[
      "animate-pulse rounded-[20px] border border-white/40 bg-[linear-gradient(90deg,rgba(255,255,255,0.75),rgba(236,239,243,0.95),rgba(255,255,255,0.75))] shadow-[var(--shadow-panel)]",
      "dark:border-white/6 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.08),rgba(255,255,255,0.04))]",
      className,
    ].join(" ")}
  />
);

export const ProjectCardSkeleton = () => (
  <div className="rounded-[28px] border border-border bg-card/90 p-5 shadow-[var(--shadow-panel)] backdrop-blur-xl">
    <Skeleton className="h-6 w-20 rounded-full" />
    <Skeleton className="mt-4 h-8 w-2/3" />
    <Skeleton className="mt-3 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-4/5" />
    <Skeleton className="mt-5 h-20 w-full rounded-[24px]" />
    <div className="mt-5 flex gap-2">
      <Skeleton className="h-11 w-11 rounded-full" />
      <Skeleton className="h-11 w-11 rounded-full" />
      <Skeleton className="h-11 w-11 rounded-full" />
    </div>
  </div>
);

export const ProjectListSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    <ProjectCardSkeleton />
    <ProjectCardSkeleton />
    <ProjectCardSkeleton />
  </div>
);
