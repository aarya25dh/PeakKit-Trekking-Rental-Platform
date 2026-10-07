import React from "react";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-stone-200/75 ${className}`}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl border border-stone-200/80 bg-white p-4 shadow-xs">
      <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-stone-200/80" />
      <div className="mt-4 space-y-2.5">
        <div className="h-3 w-1/4 animate-pulse rounded-md bg-stone-200/70" />
        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-stone-200/90" />
        <div className="h-4 w-1/2 animate-pulse rounded-md bg-stone-200/60" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-3">
        <div className="h-5 w-1/3 animate-pulse rounded-lg bg-stone-200/80" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-stone-200/80" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="h-4 rounded-lg bg-stone-200/75"
            style={{ width: `${Math.max(45, ((i * 37 + 53) % 45) + 50)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 rounded-md bg-stone-200/80" />
        <div className="h-9 w-9 rounded-2xl bg-stone-200/80" />
      </div>
      <div className="mt-4 h-8 w-32 rounded-xl bg-stone-200/90" />
      <div className="mt-2 h-3.5 w-20 rounded-md bg-stone-200/60" />
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-stone-200/70" />
          <div className="h-6 w-44 rounded-lg bg-stone-200/90" />
        </div>
        <div className="h-6 w-24 rounded-full bg-stone-200/80" />
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-stone-50 p-4">
        <div className="h-8 rounded-lg bg-stone-200/60" />
        <div className="h-8 rounded-lg bg-stone-200/60" />
        <div className="h-8 rounded-lg bg-stone-200/60" />
        <div className="h-8 rounded-lg bg-stone-200/60" />
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <div className="h-4 w-28 rounded bg-stone-200/60" />
        <div className="h-8 w-28 rounded-full bg-stone-200/80" />
      </div>
    </div>
  );
}

export default Skeleton;
