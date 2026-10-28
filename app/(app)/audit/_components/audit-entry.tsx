import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { entityPath, historyHref, type AuditLog } from "@/lib/audit";
import { roleLabel } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

const actions = {
  create: { tone: "success", label: "Created" },
  update: { tone: "info", label: "Updated" },
  delete: { tone: "danger", label: "Deleted" },
} as const;

function show(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// An update holds only the changed fields; create and delete hold the whole
// record on one side.
function Changes({ log }: { log: AuditLog }) {
  const fields = [
    ...new Set([
      ...Object.keys(log.oldValues ?? {}),
      ...Object.keys(log.newValues ?? {}),
    ]),
  ];
  if (!fields.length) return <p className="text-sm text-muted">No values.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Field
            </th>
            {log.action !== "create" && (
              <th scope="col" className="px-3 py-2 font-medium">
                Before
              </th>
            )}
            {log.action !== "delete" && (
              <th scope="col" className="px-3 py-2 font-medium">
                After
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {fields.map((field) => (
            <tr key={field}>
              <th scope="row" className="px-3 py-2 font-medium">
                {field}
              </th>
              {log.action !== "create" && (
                <td className="px-3 py-2 break-all">
                  {show(log.oldValues?.[field])}
                </td>
              )}
              {log.action !== "delete" && (
                <td className="px-3 py-2 break-all">
                  {show(log.newValues?.[field])}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditEntry({ log }: { log: AuditLog }) {
  const action = actions[log.action] ?? {
    tone: "neutral",
    label: log.action,
  };
  const target =
    log.action !== "delete" && entityPath(log.entityType, log.entityId);

  return (
    <li className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 font-medium wrap-break-word">
          {log.entityType}{" "}
          {target ? (
            <Link href={target} className="underline-offset-2 hover:underline">
              #{log.entityId}
            </Link>
          ) : (
            `#${log.entityId}`
          )}
        </p>
        <StatusBadge tone={action.tone}>{action.label}</StatusBadge>
      </div>
      <p className="text-sm text-muted">
        <time dateTime={log.createdAt}>{formatDateTime(log.createdAt)}</time>
        {" · "}
        {log.actorId ? (
          <Link
            href={`/audit?actorId=${log.actorId}`}
            className="underline-offset-2 hover:underline"
          >
            User #{log.actorId}
            {log.actorRole && ` (${roleLabel(log.actorRole)})`}
          </Link>
        ) : (
          "System"
        )}
        {log.ip && ` · ${log.ip}`}
      </p>
      <details className="group">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-primary">
          <span className="group-open:hidden">Show changes</span>
          <span className="hidden group-open:inline">Hide changes</span>
        </summary>
        <div className="mt-2 space-y-2">
          <Changes log={log} />
          <Link
            href={historyHref(log.entityType, log.entityId)}
            className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground"
          >
            All changes to this record
          </Link>
        </div>
      </details>
    </li>
  );
}
