import { SelectField } from "@/components/form";
import { can, type ApiUser } from "@/lib/auth";
import { listCategories, listProducts } from "@/lib/catalog";
import { itemStatusLabel } from "@/lib/catalog-labels";
import { itemStatuses, type ItemQuery } from "@/lib/items";
import { listSites } from "@/lib/sites";

export function itemFilterOptions(actor: ApiUser) {
  return Promise.all([
    listProducts({ limit: "100" }),
    listCategories({ limit: "100" }),
    can(actor, "read", "Site") ? listSites({ limit: "100" }) : null,
  ]);
}

// The selects shared by the stock and items lists, so a stock row's link
// opens the items list with the same filters showing.
export function ItemFilters({
  query,
  options: [products, categories, sites],
}: {
  query: ItemQuery;
  options: Awaited<ReturnType<typeof itemFilterOptions>>;
}) {
  return (
    <>
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
      {sites?.ok ? (
        <SelectField id="siteId" label="Site" defaultValue={query.siteId ?? ""}>
          <option value="">All sites</option>
          {sites.data.items.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </SelectField>
      ) : (
        // Item readers without read Site still arrive with ?siteId= from a
        // stock row; filtering again must not drop it.
        query.siteId && (
          <input type="hidden" name="siteId" value={query.siteId} />
        )
      )}
      <SelectField id="status" label="Status" defaultValue={query.status ?? ""}>
        <option value="">All statuses</option>
        {itemStatuses.map((status) => (
          <option key={status} value={status}>
            {itemStatusLabel(status)}
          </option>
        ))}
      </SelectField>
    </>
  );
}
