import { DataList } from "@/components/data-list";
import { StatusBadge } from "@/components/status-badge";
import { fullName } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  requestCode,
  requestStatusLabel,
  requestStatusTone,
} from "@/lib/request-labels";
import type { RequestRow } from "@/lib/stock-requests";

export function RequestStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge tone={requestStatusTone(status)}>
      {requestStatusLabel(status)}
    </StatusBadge>
  );
}

const contents = (row: RequestRow) =>
  `${row.lineCount} ${row.lineCount === 1 ? "product" : "products"}, ${row.totalQuantity} units`;

const sent = (row: RequestRow) =>
  !row.requestedAt
    ? "Not sent yet"
    : row.requestedBy
      ? `${formatDate(row.requestedAt)} by ${fullName(row.requestedBy)}`
      : formatDate(row.requestedAt);

export function RequestList({ rows }: { rows: RequestRow[] }) {
  return (
    <DataList
      rows={rows}
      href={(row) => `/logistics/requests/${row.id}`}
      card={(row) => ({
        title: (
          <span>
            <span className="font-mono">{requestCode(row.id)}</span> ·{" "}
            {row.site.name}
          </span>
        ),
        subtitle: contents(row),
        badge: <RequestStatusBadge status={row.status} />,
        meta: [
          row.requestedAt ? `Sent ${sent(row)}` : sent(row),
          row.neededBy && `needed by ${formatDate(row.neededBy)}`,
        ]
          .filter(Boolean)
          .join(" · "),
      })}
      columns={[
        {
          header: "Request",
          cell: (row) => (
            <span className="font-mono">{requestCode(row.id)}</span>
          ),
        },
        { header: "Site", cell: (row) => row.site.name },
        { header: "Contents", cell: contents },
        { header: "Sent", cell: sent },
        {
          header: "Needed by",
          cell: (row) => (row.neededBy ? formatDate(row.neededBy) : "—"),
        },
        {
          header: "Status",
          cell: (row) => <RequestStatusBadge status={row.status} />,
        },
      ]}
    />
  );
}
