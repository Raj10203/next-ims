import { DataList } from "@/components/data-list";
import { itemStatusLabel } from "@/lib/catalog-labels";
import type { StockRow } from "@/lib/items";
import { toSearch } from "@/lib/query";

// Each row opens the items it counts.
export function StockList({ rows }: { rows: StockRow[] }) {
  return (
    <DataList
      rows={rows.map((row) => ({
        ...row,
        id: `${row.productId}-${row.siteId}-${row.status}`,
      }))}
      href={(row) =>
        `/inventory/items${toSearch({
          productId: String(row.productId),
          siteId: String(row.siteId),
          status: row.status,
        })}`
      }
      card={(row) => ({
        title: row.productName,
        subtitle: `${row.siteName} · ${itemStatusLabel(row.status)}`,
        badge: (
          <span className="text-lg font-semibold tabular-nums">
            {row.count}
          </span>
        ),
      })}
      columns={[
        { header: "Product", cell: (row) => row.productName },
        { header: "Prefix", cell: (row) => row.prefix },
        { header: "Site", cell: (row) => row.siteName },
        { header: "Status", cell: (row) => itemStatusLabel(row.status) },
        { header: "Count", cell: (row) => row.count, align: "right" },
      ]}
    />
  );
}
