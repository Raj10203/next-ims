import type { Metadata } from "next";
import { Suspense } from "react";
import { DataList } from "@/components/data-list";
import { ListBody, ListTransition } from "@/components/list-transition";
import { FilterForm, SearchFilter } from "@/components/filter-form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { conditionLabel, itemStatusLabel } from "@/lib/catalog-labels";
import { listItems, parseItemQuery } from "@/lib/items";
import { isFiltered } from "@/lib/query";
import { AddStockLink } from "../_components/add-stock-link";
import { ItemFilters, itemFilterOptions } from "../_components/item-filters";

export const metadata: Metadata = { title: "Items" };

async function ItemList({
  searchParams,
}: {
  searchParams: PageProps<"/inventory/items">["searchParams"];
}) {
  const query = parseItemQuery(await searchParams);
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;

  const [result, options] = await Promise.all([
    listItems(query),
    itemFilterOptions(actor.data),
  ]);

  return (
    <ListTransition>
      <div className="space-y-4">
        <FilterForm action="/inventory/items" query={query}>
          <SearchFilter
            value={query.search}
            placeholder="Code or serial number"
            maxLength={100}
          />
          <ItemFilters query={query} options={options} />
        </FilterForm>
        <ListBody>
          {!result.ok ? (
            <LoadError error={result.error} />
          ) : !result.data.items.length ? (
            isFiltered(query) || query.page ? (
              <EmptyState
                title="No items match these filters"
                description="Try another search or clear the filters."
              />
            ) : (
              <EmptyState
                title="No stock yet"
                description="Items appear here once stock is added at headquarters."
              />
            )
          ) : (
            <>
              <DataList
                rows={result.data.items}
                href={(item) => `/inventory/items/${item.id}`}
                card={(item) => ({
                  title: <span className="font-mono">{item.code}</span>,
                  subtitle: item.product.name,
                  badge: (
                    <StatusBadge tone="success">
                      {itemStatusLabel(item.status)}
                    </StatusBadge>
                  ),
                  meta: `${item.site.name} · Condition ${conditionLabel(item.condition)}`,
                })}
                columns={[
                  {
                    header: "Code",
                    cell: (item) => (
                      <span className="font-mono">{item.code}</span>
                    ),
                  },
                  { header: "Product", cell: (item) => item.product.name },
                  { header: "Site", cell: (item) => item.site.name },
                  {
                    header: "Status",
                    cell: (item) => (
                      <StatusBadge tone="success">
                        {itemStatusLabel(item.status)}
                      </StatusBadge>
                    ),
                  },
                  {
                    header: "Condition",
                    cell: (item) => conditionLabel(item.condition),
                  },
                  {
                    header: "Serial",
                    cell: (item) => item.serialNumber ?? "—",
                  },
                ]}
              />
              <Pagination
                path="/inventory/items"
                query={query}
                {...result.data}
              />
            </>
          )}
        </ListBody>
      </div>
    </ListTransition>
  );
}

export default function ItemsPage({
  searchParams,
}: PageProps<"/inventory/items">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Items">
        <Suspense>
          <AddStockLink />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<ListSkeleton />}>
        <ItemList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
