import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataList } from "@/components/data-list";
import { ListBody, ListTransition } from "@/components/list-transition";
import {
  ActiveFilter,
  FilterForm,
  SearchFilter,
} from "@/components/filter-form";
import { submitClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { ActiveBadge } from "@/components/status-badge";
import { can, getCurrentUser } from "@/lib/auth";
import { listCategories, parseCategoryQuery } from "@/lib/catalog";
import { isFiltered } from "@/lib/query";

export const metadata: Metadata = { title: "Categories" };

const path = "/inventory/categories";

async function AddCategoryLink() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "create", "Category")) return null;
  return (
    <Link href={`${path}/new`} className={`${submitClass} w-auto`}>
      <Plus aria-hidden="true" className="size-4" />
      Add category
    </Link>
  );
}

async function CategoryList({
  searchParams,
}: {
  searchParams: PageProps<"/inventory/categories">["searchParams"];
}) {
  const query = parseCategoryQuery(await searchParams);
  const result = await listCategories(query);

  return (
    <ListTransition>
      <div className="space-y-4">
        <FilterForm action={path} query={query}>
          <SearchFilter
            value={query.search}
            placeholder="Category name"
            maxLength={100}
          />
          <ActiveFilter value={query.isActive} />
        </FilterForm>
        <ListBody>
          {!result.ok ? (
            <LoadError error={result.error} />
          ) : !result.data.items.length ? (
            isFiltered(query) || query.page ? (
              <EmptyState
                title="No categories match these filters"
                description="Try another search or clear the filters."
              />
            ) : (
              <EmptyState
                title="No categories yet"
                description="Categories group products, such as Power Tools or Safety."
              />
            )
          ) : (
            <>
              <DataList
                rows={result.data.items}
                href={(category) => `${path}/${category.id}`}
                card={(category) => ({
                  title: category.name,
                  subtitle: category.description,
                  badge: <ActiveBadge active={category.isActive} />,
                })}
                columns={[
                  { header: "Name", cell: (category) => category.name },
                  {
                    header: "Description",
                    cell: (category) => category.description ?? "—",
                  },
                  {
                    header: "Status",
                    cell: (category) => (
                      <ActiveBadge active={category.isActive} />
                    ),
                  },
                ]}
              />
              <Pagination path={path} query={query} {...result.data} />
            </>
          )}
        </ListBody>
      </div>
    </ListTransition>
  );
}

export default function CategoriesPage({
  searchParams,
}: PageProps<"/inventory/categories">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Categories">
        <Suspense>
          <AddCategoryLink />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<ListSkeleton />}>
        <CategoryList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
