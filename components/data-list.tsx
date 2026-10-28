import Link from "next/link";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "right";
};

type Card = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
};

// Cards on phones, a table from md up. The first column links to the row.
export function DataList<T extends { id: number | string }>({
  rows,
  href,
  columns,
  card,
}: {
  rows: T[];
  href?: (row: T) => string;
  columns: Column<T>[];
  card: (row: T) => Card;
}) {
  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface md:hidden">
        {rows.map((row) => {
          const { title, subtitle, badge, meta } = card(row);
          const heading = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{title}</span>
                {subtitle && (
                  <span className="block truncate text-sm text-muted">
                    {subtitle}
                  </span>
                )}
              </span>
              {badge}
            </>
          );
          return (
            <li key={row.id} className="p-4">
              {href ? (
                <Link
                  href={href(row)}
                  className="flex min-h-11 items-center gap-3"
                >
                  {heading}
                </Link>
              ) : (
                <div className="flex min-h-11 items-center gap-3">
                  {heading}
                </div>
              )}
              {meta && <div className="mt-2 text-sm text-muted">{meta}</div>}
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={`px-4 py-3 font-medium ${column.align === "right" ? "text-right" : ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column, index) => (
                  <td
                    key={column.header}
                    className={`px-4 py-3 ${column.align === "right" ? "text-right tabular-nums" : ""}`}
                  >
                    {index === 0 && href ? (
                      <Link
                        href={href(row)}
                        className="font-medium hover:underline"
                      >
                        {column.cell(row)}
                      </Link>
                    ) : (
                      column.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
