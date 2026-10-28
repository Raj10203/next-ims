import { ChevronLeft, ChevronRight } from "lucide-react";
import { outlineClass } from "@/components/form";
import { ListLink } from "@/components/list-transition";
import { toSearch, type Query } from "@/lib/query";

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
      {pages > 1 && (
        <div className="flex gap-2">
          {page > 1 && (
            <ListLink href={href(page - 1)} className={outlineClass}>
              <ChevronLeft aria-hidden="true" className="size-4" />
              Previous
            </ListLink>
          )}
          {page < pages && (
            <ListLink href={href(page + 1)} className={outlineClass}>
              Next
              <ChevronRight aria-hidden="true" className="size-4" />
            </ListLink>
          )}
        </div>
      )}
    </nav>
  );
}
