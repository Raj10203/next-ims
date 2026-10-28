import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataList } from "@/components/data-list";
import { ListBody, ListTransition } from "@/components/list-transition";
import { FilterForm, SearchFilter } from "@/components/filter-form";
import { SelectField, submitClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { can, getCurrentUser } from "@/lib/auth";
import { listCategories, listProducts } from "@/lib/catalog";
import { conditionLabel, itemStatusLabel } from "@/lib/catalog-labels";
import { itemStatuses, listItems, parseItemQuery } from "@/lib/items";
import { isFiltered } from "@/lib/query";
import { listSites } from "@/lib/sites";

export const metadata: Metadata = { title: "Items" };

async function AddStockLink() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "create", "Item")) return null;
  return (
    <Link href="/inventory/new" className={`${submitClass} w-auto`}>
      <Plus aria-hidden="true" className="size-4" />
      Add stock
    </Link>
  );
}

async function ItemList({
  searchParams,
}: {
  searchParams: PageProps<"/inventory">["searchParams"];
}) {
  const query = parseItemQuery(await searchParams);
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;

  const [result, products, categories, sites] = await Promise.all([
    listItems(query),
    listProducts({ limit: "100" }),
    listCategories({ limit: "100" }),
    can(actor.data, "read", "Site") ? listSites({ limit: "100" }) : null,
  ]);

  return (
    <ListTransition>
      <div className="space-y-4">
        <FilterForm action="/inventory" query={query}>
          <SearchFilter
            value={query.search}
            placeholder="Code or serial number"
            maxLength={100}
          />
          {products.ok && (
            <SelectField
              id="productId"
              label="Product"
              defaultValue={query.productId ?? ""}
            >
              <option value="">All products</option>
              {products.data.items.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.prefix})
                </option>
              ))}
            </SelectField>
          )}
          {categories.ok && (
            <SelectField
              id="categoryId"
              label="Category"
              defaultValue={query.categoryId ?? ""}
            >
              <option value="">All categories</option>
              {categories.data.items.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
          )}
          {sites?.ok && (
            <SelectField
              id="siteId"
              label="Site"
              defaultValue={query.siteId ?? ""}
            >
              <option value="">All sites</option>
              {sites.data.items.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </SelectField>
          )}
          <SelectField
            id="status"
            label="Status"
            defaultValue={query.status ?? ""}
          >
            <option value="">All statuses</option>
            {itemStatuses.map((status) => (
              <option key={status} value={status}>
                {itemStatusLabel(status)}
              </option>
            ))}
          </SelectField>
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
                href={(item) => `/inventory/${item.id}`}
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
              <Pagination path="/inventory" query={query} {...result.data} />
            </>
          )}
        </ListBody>
      </div>
    </ListTransition>
  );
}

export default function ItemsPage({ searchParams }: PageProps<"/inventory">) {
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
