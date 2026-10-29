import { Check, Circle, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { DataList } from "@/components/data-list";
import { DeleteButton } from "@/components/delete-button";
import { outlineClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { PageLayout } from "@/components/page-layout";
import { DetailList, Section } from "@/components/section";
import {
  DetailSkeleton,
  EmptyState,
  LoadError,
  NotFoundState,
} from "@/components/states";
import { historyHref } from "@/lib/audit";
import { can, fullName, getCurrentUser } from "@/lib/auth";
import { packLabel } from "@/lib/catalog-labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { toPickerOption } from "@/lib/pickers";
import {
  deliveryStatuses,
  requestCode,
  requestEventLabel,
} from "@/lib/request-labels";
import type { PersonSummary } from "@/lib/sites";
import {
  getRequest,
  listRequestComments,
  listRequestEvents,
  type RequestComment,
  type RequestDetail,
} from "@/lib/stock-requests";
import { RequestStatusBadge } from "../../_components/request-list";
import { CancelRequest } from "../_components/cancel-request";
import { CommentForm, ReplyButton } from "../_components/comment-form";
import { DecisionForm } from "../_components/decision-form";
import { RouteForm } from "../_components/route-form";
import { RequestForm } from "../_components/request-form";
import { RequestRoute } from "../../_components/request-route";

export const metadata: Metadata = { title: "Stock request" };

const byWhom = (person: PersonSummary | null, at: string) =>
  person ? `${fullName(person)}, ${formatDateTime(at)}` : formatDateTime(at);

type Step = {
  label: string;
  state: "done" | "current" | "stopped" | "waiting";
  detail?: string;
};

// The review chain as the requester sees it: sent, HQ review, manager
// approval. A rejection or cancellation stops it at the step it reached.
function steps(request: RequestDetail): Step[] {
  const closed =
    request.status === "rejected" || request.status === "cancelled";
  const stoppedHere = (reached: boolean): Step["state"] =>
    closed && reached ? "stopped" : "waiting";
  const closedDetail =
    closed && request.closedAt
      ? `${request.status === "rejected" ? "Rejected" : "Cancelled"} by ${byWhom(request.closedBy, request.closedAt)}`
      : undefined;
  // HQ's own requests are approved as they are raised, with no review.
  const routed = !!request.approvedAt && !request.reviewedAt;
  if (routed) {
    return [
      {
        label: "Raised by HQ",
        state: "done",
        detail: byWhom(request.requestedBy, request.requestedAt!),
      },
      { label: "HQ review", state: "done", detail: "Not needed" },
      {
        label: "Approved",
        state: "done",
        detail: byWhom(request.approvedBy, request.approvedAt!),
      },
    ];
  }
  return [
    request.requestedAt
      ? {
          label: "Sent to HQ",
          state: "done",
          detail: byWhom(request.requestedBy, request.requestedAt),
        }
      : request.status === "draft"
        ? { label: "Sent to HQ", state: "current", detail: "Draft, not sent" }
        : { label: "Sent to HQ", state: "done" },
    request.reviewedAt
      ? {
          label: "HQ review",
          state: "done",
          detail: byWhom(request.reviewedBy, request.reviewedAt),
        }
      : request.status === "pending_review"
        ? { label: "HQ review", state: "current", detail: "Waiting" }
        : {
            label: "HQ review",
            state: stoppedHere(true),
            detail: closedDetail,
          },
    request.approvedAt
      ? {
          label: "Manager approval",
          state: "done",
          detail: byWhom(request.approvedBy, request.approvedAt),
        }
      : request.status === "pending_approval"
        ? { label: "Manager approval", state: "current", detail: "Waiting" }
        : {
            label: "Manager approval",
            state: stoppedHere(!!request.reviewedAt),
            detail: request.reviewedAt ? closedDetail : undefined,
          },
  ];
}

const stepStyles = {
  done: { icon: Check, className: "bg-success text-white" },
  current: { icon: Circle, className: "bg-warning/15 text-warning" },
  stopped: { icon: X, className: "bg-danger text-white" },
  waiting: { icon: Circle, className: "bg-surface-muted text-muted" },
};

function Progress({ request }: { request: RequestDetail }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {steps(request).map((step) => {
        const { icon: Icon, className } = stepStyles[step.state];
        return (
          <li key={step.label} className="flex items-start gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${className}`}
            >
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">
                {step.label}
                <span className="sr-only">: {step.state}</span>
              </span>
              {step.detail && (
                <span className="block text-sm text-muted">{step.detail}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Comment({
  comment,
  replies,
  requestId,
}: {
  comment: RequestComment;
  replies: RequestComment[];
  requestId: number;
}) {
  const name = comment.author ? fullName(comment.author) : "Removed user";
  return (
    <li className="space-y-3">
      <div className="flex gap-3">
        <Avatar name={name} src={comment.author?.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{name}</span>{" "}
            <span className="text-muted">
              {formatDateTime(comment.createdAt)}
            </span>
          </p>
          <p className="mt-1 text-sm wrap-break-word whitespace-pre-line">
            {comment.body}
          </p>
        </div>
      </div>
      {replies.length > 0 && (
        <ul className="ml-11 space-y-3 border-l border-border pl-4">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              replies={[]}
              requestId={requestId}
            />
          ))}
        </ul>
      )}
      {comment.parentId === null && (
        <div className="ml-11">
          <ReplyButton requestId={requestId} parentId={comment.id} />
        </div>
      )}
    </li>
  );
}

async function RequestView({
  params,
}: {
  params: PageProps<"/logistics/requests/[id]">["params"];
}) {
  const { id } = await params;
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const [result, events, comments] = await Promise.all([
    getRequest(id),
    listRequestEvents(id),
    listRequestComments(id),
  ]);
  if (!result.ok) {
    return result.error.statusCode === 404 ? (
      <NotFoundState
        title="Stock request not found"
        href="/logistics/requests"
        label="All requests"
      />
    ) : (
      <LoadError error={result.error} />
    );
  }
  const request = result.data;
  const productLabel = (line: RequestDetail["lines"][number]) =>
    `${line.product.name} (${line.product.prefix})`;
  const draft = request.status === "draft";
  const delivery = deliveryStatuses.includes(request.status);
  const top = comments.ok
    ? comments.data.filter((comment) => comment.parentId === null)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={requestCode(request.id)}
        description={`${request.fromSite.name} → ${request.site.name}`}
      >
        <span className="flex flex-wrap items-center gap-3">
          <RequestStatusBadge status={request.status} />
          {request.allowed.cancel && <CancelRequest requestId={request.id} />}
          {draft && request.allowed.edit && (
            <DeleteButton
              path={`/stock-requests/${request.id}`}
              title="Discard this draft?"
              description="The draft and its comments are removed for everyone at your site. This cannot be undone."
              label="Discard draft"
              redirectTo="/logistics/requests"
            />
          )}
        </span>
      </PageHeader>

      <Section id="progress" title="Review">
        <Progress request={request} />
      </Section>

      <Section id="overview" title="Overview">
        <DetailList
          rows={[
            [
              "Route",
              <RequestRoute
                key="route"
                from={request.fromSite.name}
                to={request.site.name}
              />,
            ],
            [
              "Assignee",
              request.assignee ? fullName(request.assignee) : "Nobody",
            ],
            [
              "Requester",
              request.requestedBy
                ? fullName(request.requestedBy)
                : draft
                  ? "Whoever sends the draft"
                  : "Removed user",
            ],
            [
              "Needed by",
              request.neededBy ? formatDate(request.neededBy) : "Not given",
            ],
            ["Note", request.note ?? "None"],
          ]}
        />
        {can(actor.data, "read", "AuditLog") && (
          <div className="mt-5">
            <Link
              href={historyHref("StockRequest", request.id)}
              className={`${outlineClass} w-fit`}
            >
              Audit log
            </Link>
          </div>
        )}
      </Section>

      {request.allowed.route && (
        <Section
          id="route"
          title="Route and assignee"
          description="Until the stock is packed, HQ can send it from another site, to another site, or give it to another employee there."
        >
          <RouteForm
            requestId={request.id}
            initial={{
              from: toPickerOption("site", request.fromSite),
              to: toPickerOption("site", request.site),
              assignee: request.assignee
                ? toPickerOption("assignee", request.assignee)
                : null,
            }}
          />
        </Section>
      )}

      <Section
        id="products"
        title="Products"
        description={
          request.allowed.edit
            ? "Anyone at your site can change this draft until it is sent."
            : request.allowed.decide
              ? request.status === "pending_approval"
                ? "Approved at HQ review. Check the quantities and give the final approval, or reject."
                : "Check the quantities and approve for the manager, or reject."
              : undefined
        }
      >
        {request.allowed.edit ? (
          <RequestForm
            draft={{
              id: request.id,
              note: request.note,
              neededBy: request.neededBy,
              lines: request.lines.map((line) => ({
                product: toPickerOption("product", line.product),
                quantity: line.quantity,
                note: line.note,
              })),
            }}
          />
        ) : request.allowed.decide ? (
          <DecisionForm
            requestId={request.id}
            finalStep={request.status === "pending_approval"}
            lines={request.lines.map((line) => ({
              id: line.id,
              product: productLabel(line),
              note: line.note,
              requestedQuantity: line.requestedQuantity,
              quantity: line.quantity,
            }))}
          />
        ) : (
          <DataList
            rows={request.lines}
            card={(line) => ({
              title: productLabel(line),
              subtitle: line.note ?? packLabel(line.product),
              badge: (
                <span className="font-semibold tabular-nums">
                  {line.quantity}
                </span>
              ),
              meta:
                [
                  line.quantity !== line.requestedQuantity &&
                    `Asked for ${line.requestedQuantity}`,
                  delivery && `${line.received} received`,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined,
            })}
            columns={[
              {
                header: "Product",
                cell: (line) => (
                  <>
                    {productLabel(line)}
                    {line.note && (
                      <span className="block text-muted">{line.note}</span>
                    )}
                  </>
                ),
              },
              { header: "Unit", cell: (line) => packLabel(line.product) },
              {
                header: "Asked",
                cell: (line) => line.requestedQuantity,
                align: "right",
              },
              {
                header: "Approved",
                cell: (line) => line.quantity,
                align: "right",
              },
              ...(delivery
                ? [
                    {
                      header: "Received",
                      cell: (line: RequestDetail["lines"][number]) =>
                        line.received,
                      align: "right" as const,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Section>

      <Section
        id="conversation"
        title="Conversation"
        description={
          draft
            ? "Your site's employees can talk the draft over here. Nobody is notified until it is sent."
            : `${request.site.name} and HQ can comment and reply. ${request.requestedBy ? fullName(request.requestedBy) : "The requester"}, who sent the request, is notified of each comment.`
        }
      >
        <div className="space-y-6">
          {!comments.ok ? (
            <LoadError error={comments.error} />
          ) : top.length ? (
            <ul className="space-y-6">
              {top.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  requestId={request.id}
                  replies={comments.data.filter(
                    (reply) => reply.parentId === comment.id,
                  )}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No comments yet.</p>
          )}
          <CommentForm requestId={request.id} />
        </div>
      </Section>

      <Section id="history" title="History">
        {!events.ok ? (
          <LoadError error={events.error} />
        ) : !events.data.length ? (
          <EmptyState title="No history" />
        ) : (
          <ol className="space-y-4">
            {events.data.map((event) => (
              <li key={event.id} className="text-sm">
                <p>
                  <span className="font-medium">
                    {event.performedBy
                      ? fullName(event.performedBy)
                      : "Removed user"}
                  </span>{" "}
                  {requestEventLabel(event.action)}
                  {event.product &&
                    `: ${event.product.name} (${event.product.prefix}), ${event.quantityBefore} → ${event.quantityAfter}`}
                  {event.action === "route_changed" &&
                    event.fromSite &&
                    event.toSite &&
                    `: ${event.fromSite.name} → ${event.toSite.name}`}
                  {event.action === "assigned" &&
                    `: ${event.assignee ? fullName(event.assignee) : "nobody"}`}
                  {event.action === "requester_changed" &&
                    event.requester &&
                    ` to ${fullName(event.requester)}`}
                </p>
                <p className="text-muted">{formatDateTime(event.createdAt)}</p>
                {event.note && (
                  <p className="mt-1 whitespace-pre-line">“{event.note}”</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}

export default function RequestPage({
  params,
}: PageProps<"/logistics/requests/[id]">) {
  return (
    <PageLayout back={{ href: "/logistics/requests", label: "Stock requests" }}>
      <Suspense fallback={<DetailSkeleton />}>
        <RequestView params={params} />
      </Suspense>
    </PageLayout>
  );
}
