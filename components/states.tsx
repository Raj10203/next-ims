import { Inbox, SearchX, ShieldOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { FormMessage, outlineClass } from "@/components/form";
import type { ApiError } from "@/lib/api-result";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-4 py-12 text-center">
      <Icon aria-hidden="true" className="size-10 text-muted" />
      <p className="mt-3 font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function NotFoundState({
  title,
  href,
  label,
}: {
  title: string;
  href: string;
  label: string;
}) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description="It does not exist, or it is not one you may see."
    >
      <Link href={href} className={outlineClass}>
        {label}
      </Link>
    </EmptyState>
  );
}

// 403 is the role, not a fault: say so instead of showing an error.
export function LoadError({ error }: { error: ApiError }) {
  if (error.statusCode === 403) {
    return (
      <EmptyState
        icon={ShieldOff}
        title="Not available to your role"
        description={error.message}
      />
    );
  }
  return <FormMessage message={error.message} />;
}

function Bar({ className }: { className: string }) {
  return <span className={`block skeleton rounded-md ${className}`} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="hidden gap-6 border-b border-border bg-surface-muted px-4 py-3.5 md:flex">
        <Bar className="h-3 w-32" />
        <Bar className="h-3 w-20" />
        <Bar className="h-3 w-24" />
        <Bar className="ml-auto h-3 w-16" />
      </div>
      <ul className="divide-y divide-border">
        {Array.from({ length: rows }, (_, row) => (
          <li key={row} className="flex items-center gap-4 px-4 py-4">
            <Bar className="size-8 shrink-0 rounded-full" />
            <span className="min-w-0 flex-1 space-y-2">
              <Bar className={`h-3.5 ${row % 2 ? "w-2/5" : "w-1/2"}`} />
              <Bar className="h-3 w-1/3 md:hidden" />
            </span>
            <Bar className="hidden h-3.5 w-24 md:block" />
            <Bar className="hidden h-3.5 w-28 lg:block" />
            <Bar className="h-5 w-16 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Bar className="h-3.5 w-16" />
        <Bar className="h-11 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Bar className="h-3.5 w-20" />
        <Bar className="h-11 w-full rounded-lg" />
      </div>
      <div className="flex items-end">
        <Bar className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

// Screen readers hear one "Loading…" instead of the shapes.
export function ListSkeleton({ filters = true }: { filters?: boolean }) {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="space-y-4">
        {filters && <FilterSkeleton />}
        <TableSkeleton />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="space-y-6">
        <div className="space-y-2">
          <Bar className="h-8 w-64 max-w-full" />
          <Bar className="h-4 w-32" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <Bar className="h-5 w-28" />
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, cell) => (
              <div key={cell} className="space-y-2">
                <Bar className="h-3 w-20" />
                <Bar className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((card) => (
            <div
              key={card}
              className="rounded-xl border border-border bg-surface p-5 sm:p-6"
            >
              <FormSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5">
      {Array.from({ length: 3 }, (_, field) => (
        <div key={field} className="space-y-2">
          <Bar className="h-3.5 w-24" />
          <Bar className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Bar className="h-11 w-32 rounded-lg" />
    </div>
  );
}
