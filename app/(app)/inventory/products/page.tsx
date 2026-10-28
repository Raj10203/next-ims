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
import { SelectField, submitClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { SearchSelect } from "@/components/search-select";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { ActiveBadge } from "@/components/status-badge";
import { can, getCurrentUser } from "@/lib/auth";
import {
  getProductOptions,
  listProducts,
  parseProductQuery,
} from "@/lib/catalog";
import {
  measureTypeLabel,
  packLabel,
  productTypeLabel,
} from "@/lib/catalog-labels";
import { pickedOption } from "@/lib/picked";
import { isFiltered } from "@/lib/query";

export const metadata: Metadata = { title: "Products" };

const path = "/inventory/products";

async function AddProductLink() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "create", "Product")) return null;
  return (
    <Link href={`${path}/new`} className={`${submitClass} w-auto`}>
      <Plus aria-hidden="true" className="size-4" />
      Add product
    </Link>
  );
}

async function ProductList({
  searchParams,
}: {
  searchParams: PageProps<"/inventory/products">["searchParams"];
}) {
  const query = parseProductQuery(await searchParams);
  const [result, category, options] = await Promise.all([
    listProducts(query),
    pickedOption("category", query.categoryId),
    getProductOptions(),
  ]);

  return (
    <ListTransition>
      <div className="space-y-4">
        <FilterForm action={path} query={query}>
          <SearchFilter
            value={query.search}
            placeholder="Name or prefix"
            maxLength={150}
          />
          <SearchSelect
            id="categoryId"
            label="Category"
            kind="category"
            value={category}
            emptyLabel="All categories"
          />
          {options.ok && (
            <>
              <SelectField
                id="type"
                label="Type"
                defaultValue={query.type ?? ""}
              >
                <option value="">All types</option>
                {options.data.types.map((type) => (
                  <option key={type} value={type}>
                    {productTypeLabel(type)}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="measureType"
                label="Counted as"
                defaultValue={query.measureType ?? ""}
              >
                <option value="">Any</option>
                {options.data.measureTypes.map((type) => (
                  <option key={type} value={type}>
                    {measureTypeLabel(type)}
                  </option>
                ))}
              </SelectField>
            </>
          )}
          <ActiveFilter value={query.isActive} />
        </FilterForm>
        <ListBody>
          {!result.ok ? (
            <LoadError error={result.error} />
          ) : !result.data.items.length ? (
            isFiltered(query) || query.page ? (
              <EmptyState
                title="No products match these filters"
                description="Try another search or clear the filters."
              />
            ) : (
              <EmptyState
                title="No products yet"
                description="A product describes what can be stocked, such as a hammer drill or a box of bolts."
              />
            )
          ) : (
            <>
              <DataList
                rows={result.data.items}
                href={(product) => `${path}/${product.id}`}
                card={(product) => ({
                  title: product.name,
                  subtitle: `${product.prefix} · ${product.category.name}`,
                  badge: <ActiveBadge active={product.isActive} />,
                  meta: `${productTypeLabel(product.type)} · ${packLabel(product)}`,
                })}
                columns={[
                  { header: "Name", cell: (product) => product.name },
                  { header: "Prefix", cell: (product) => product.prefix },
                  {
                    header: "Category",
                    cell: (product) => product.category.name,
                  },
                  {
                    header: "Type",
                    cell: (product) => productTypeLabel(product.type),
                  },
                  { header: "Unit", cell: packLabel },
                  {
                    header: "Status",
                    cell: (product) => (
                      <ActiveBadge active={product.isActive} />
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

export default function ProductsPage({
  searchParams,
}: PageProps<"/inventory/products">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Products">
        <Suspense>
          <AddProductLink />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<ListSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
