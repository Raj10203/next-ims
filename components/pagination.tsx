import { ChevronLeft, ChevronRight } from "lucide-react";
import { outlineClass } from "@/components/form";
import { ListLink } from "@/components/list-transition";
import { toSearch, type Query } from "@/lib/query";

// Both buttons always show, so they do not jump around; a link cannot be
// disabled, so one with nowhere to go is a span marked aria-disabled.
function PageLink({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  return href ? (
    <ListLink href={href} className={outlineClass}>
      {children}
    </ListLink>
  ) : (
    <span
      role="link"
      aria-disabled="true"
      className={`${outlineClass} pointer-events-none opacity-60`}
    >
      {children}
    </span>
  );
}

export function Pagination({
  path,
  query,
  total,
  page,
  limit,
}: {
  path: string;
  query: Query;
  total: number;
  page: number;
  limit: number;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const href = (target: number) =>
    path +
    toSearch({ ...query, page: target > 1 ? String(target) : undefined });
  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pages"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-muted">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <PageLink href={page > 1 ? href(page - 1) : null}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          Previous
        </PageLink>
        <PageLink href={page < pages ? href(page + 1) : null}>
          Next
          <ChevronRight aria-hidden="true" className="size-4" />
        </PageLink>
      </div>
    </nav>
  );
}
