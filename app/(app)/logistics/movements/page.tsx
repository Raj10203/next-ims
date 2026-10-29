import type { Metadata } from "next";
import { Suspense } from "react";
import { DataList } from "@/components/data-list";
import { FilterForm } from "@/components/filter-form";
import { SelectField } from "@/components/form";
import { ListBody, ListTransition } from "@/components/list-transition";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { SearchSelect } from "@/components/search-select";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { can, fullName, getCurrentUser } from "@/lib/auth";
import { conditionLabel, movementActionLabel } from "@/lib/catalog-labels";
import { formatDateTime } from "@/lib/format";
import { pickedOption } from "@/lib/picked";
import { isFiltered } from "@/lib/query";
import {
  listMovementLog,
  movementActions,
  parseMovementQuery,
  type LoggedMovement,
} from "@/lib/stock-requests";

export const metadata: Metadata = { title: "Movements" };

const path = "/logistics/movements";

const change = (movement: LoggedMovement) =>
  movement.conditionBefore !== null &&
  movement.conditionAfter !== null &&
  movement.conditionBefore !== movement.conditionAfter
    ? `Condition ${conditionLabel(movement.conditionBefore)} → ${conditionLabel(movement.conditionAfter)}`
    : (movement.note ?? "—");

async function Movements({
  searchParams,
}: {
  searchParams: PageProps<"/logistics/movements">["searchParams"];
}) {
  const query = parseMovementQuery(await searchParams);
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const [result, product, site] = await Promise.all([
    listMovementLog(query),
    pickedOption("product", query.productId),
    can(actor.data, "read", "Site")
      ? pickedOption("site", query.siteId)
      : undefined,
  ]);

  return (
    <ListTransition>
      <div className="space-y-4">
        <FilterForm action={path} query={query}>
          <SearchSelect
            id="productId"
            label="Product"
            kind="product"
            value={product}
            emptyLabel="All products"
          />
          {site !== undefined && (
            <SearchSelect
              id="siteId"
              label="Site"
              kind="site"
              value={site}
              emptyLabel="All sites"
            />
          )}
          <SelectField
            id="action"
            label="Movement"
            defaultValue={query.action ?? ""}
          >
            <option value="">All movements</option>
            {movementActions.map((action) => (
              <option key={action} value={action}>
                {movementActionLabel(action)}
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
                title="No movements match these filters"
                description="Try other filters or clear them."
              />
            ) : (
              <EmptyState
                title="No movements yet"
                description="Every item added, moved or changed shows here."
              />
            )
          ) : (
            <>
              <DataList
                rows={result.data.items}
                href={(movement) => `/inventory/items/${movement.item.id}`}
                card={(movement) => ({
                  title: (
                    <span className="font-mono">{movement.item.code}</span>
                  ),
                  subtitle: `${movementActionLabel(movement.action)} · ${movement.site.name}`,
                  meta: `${formatDateTime(movement.createdAt)}${movement.performedBy ? ` by ${fullName(movement.performedBy)}` : ""} · ${change(movement)}`,
                })}
                columns={[
                  {
                    header: "Item",
                    cell: (movement) => (
                      <span className="font-mono">{movement.item.code}</span>
                    ),
                  },
                  {
                    header: "Movement",
                    cell: (movement) => movementActionLabel(movement.action),
                  },
                  { header: "Site", cell: (movement) => movement.site.name },
                  { header: "Details", cell: change },
                  {
                    header: "When",
                    cell: (movement) => formatDateTime(movement.createdAt),
                  },
                  {
                    header: "By",
                    cell: (movement) =>
                      movement.performedBy
                        ? fullName(movement.performedBy)
                        : "—",
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

export default function MovementsPage({
  searchParams,
}: PageProps<"/logistics/movements">) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Movements"
        description="Every change of place, status or condition of an item, newest first."
      />
      <Suspense fallback={<ListSkeleton />}>
        <Movements searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
