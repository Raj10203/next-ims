import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterForm } from "@/components/filter-form";
import { ListBody, ListTransition } from "@/components/list-transition";
import { PageLayout } from "@/components/page-layout";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { getCurrentUser } from "@/lib/auth";
import { getStock, parseStockQuery } from "@/lib/items";
import { isFiltered } from "@/lib/query";
import { StockList } from "../_components/stock-list";
import { AddStockLink } from "./_components/add-stock-link";
import { ItemFilters, itemFilterOptions } from "./_components/item-filters";

export const metadata: Metadata = { title: "Stock" };

async function Stock({
  searchParams,
}: {
  searchParams: PageProps<"/inventory">["searchParams"];
}) {
  const query = parseStockQuery(await searchParams);
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;

  const [result, options] = await Promise.all([
    getStock(query),
    itemFilterOptions(actor.data, query),
  ]);

  return (
    <ListTransition>
      <div className="space-y-4">
        <FilterForm action="/inventory" query={query}>
          <ItemFilters query={query} options={options} />
        </FilterForm>
        <ListBody>
          {!result.ok ? (
            <LoadError error={result.error} />
          ) : !result.data.items.length ? (
            isFiltered(query) || query.page ? (
              <EmptyState
                title="No stock matches these filters"
                description="Try other filters or clear them."
              />
            ) : (
              <EmptyState
                title="No stock yet"
                description="Counts appear here once stock is added at headquarters."
              />
            )
          ) : (
            <>
              <StockList rows={result.data.items} />
              <Pagination path="/inventory" query={query} {...result.data} />
            </>
          )}
        </ListBody>
      </div>
    </ListTransition>
  );
}

export default function StockPage({ searchParams }: PageProps<"/inventory">) {
  return (
    <PageLayout
      title="Stock"
      description="Units of each product at each site. Open a row to see its items."
      actions={
        <Suspense>
          <AddStockLink />
        </Suspense>
      }
    >
      <Suspense fallback={<ListSkeleton />}>
        <Stock searchParams={searchParams} />
      </Suspense>
    </PageLayout>
  );
}
