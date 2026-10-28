import { SelectField } from "@/components/form";
import { SearchSelect } from "@/components/search-select";
import { can, type ApiUser } from "@/lib/auth";
import { itemStatusLabel } from "@/lib/catalog-labels";
import { itemStatuses, type ItemQuery } from "@/lib/items";
import { pickedOption } from "@/lib/picked";

// The pickers search the API, so only the filtered ids need labels here.
export function itemFilterOptions(actor: ApiUser, query: ItemQuery) {
  return Promise.all([
    can(actor, "read", "Product")
      ? pickedOption("product", query.productId)
      : undefined,
    can(actor, "read", "Category")
      ? pickedOption("category", query.categoryId)
      : undefined,
    can(actor, "read", "Site") ? pickedOption("site", query.siteId) : undefined,
  ]);
}

// The filters shared by the stock and items lists, so a stock row's link
// opens the items list with the same filters showing. undefined: the role
// may not list that kind of record, so its picker is left out.
export function ItemFilters({
  query,
  options: [product, category, site],
}: {
  query: ItemQuery;
  options: Awaited<ReturnType<typeof itemFilterOptions>>;
}) {
  return (
    <>
      {product !== undefined && (
        <SearchSelect
          id="productId"
          label="Product"
          kind="product"
          value={product}
          emptyLabel="All products"
        />
      )}
      {category !== undefined && (
        <SearchSelect
          id="categoryId"
          label="Category"
          kind="category"
          value={category}
          emptyLabel="All categories"
        />
      )}
      {site !== undefined ? (
        <SearchSelect
          id="siteId"
          label="Site"
          kind="site"
          value={site}
          emptyLabel="All sites"
        />
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
