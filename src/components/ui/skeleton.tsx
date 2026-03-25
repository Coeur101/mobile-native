interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div className={`animate-pulse rounded-2xl bg-secondary ${className}`} />
);

/** 项目卡片骨架屏 */
export const ProjectCardSkeleton = () => (
  <div className="rounded-[28px] border border-border bg-card p-5">
    <Skeleton className="h-6 w-16 rounded-full" />
    <Skeleton className="mt-3 h-6 w-3/4" />
    <Skeleton className="mt-2 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-2/3" />
    <Skeleton className="mt-5 h-16 w-full rounded-2xl" />
    <div className="mt-5 flex gap-2">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  </div>
);

/** 项目列表骨架屏 */
export const ProjectListSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2">
    <ProjectCardSkeleton />
    <ProjectCardSkeleton />
    <ProjectCardSkeleton />
  </div>
);
