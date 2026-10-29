import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataList } from "@/components/data-list";
import { ListBody, ListTransition } from "@/components/list-transition";
import { submitClass } from "@/components/form";
import { PageLayout } from "@/components/page-layout";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { ActiveBadge, StatusBadge } from "@/components/status-badge";
import { can, fullName, getCurrentUser } from "@/lib/auth";
import { listSites, parseSiteQuery, type Site } from "@/lib/sites";

export const metadata: Metadata = { title: "Sites" };

async function AddSiteLink() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "create", "Site")) return null;
  return (
    <Link href="/sites/new" className={`${submitClass} sm:w-auto`}>
      <Plus aria-hidden="true" className="size-4" />
      Add site
    </Link>
  );
}

function SiteBadges({ site }: { site: Site }) {
  return (
    <span className="flex shrink-0 flex-wrap gap-1.5">
      {site.type === "hq" && <StatusBadge tone="info">HQ</StatusBadge>}
      <ActiveBadge active={site.isActive} />
    </span>
  );
}

const place = (site: Site) =>
  [site.city, site.state].filter(Boolean).join(", ") || "No address";

async function SiteList({
  searchParams,
}: {
  searchParams: PageProps<"/sites">["searchParams"];
}) {
  const query = parseSiteQuery(await searchParams);
  const result = await listSites(query);
  if (!result.ok) return <LoadError error={result.error} />;
  if (!result.data.items.length) {
    return query.page ? (
      <EmptyState title="No sites on this page" />
    ) : (
      <EmptyState
        title="No sites yet"
        description="Headquarters appears here once the API is seeded."
      />
    );
  }

  return (
    <ListTransition>
      <ListBody>
        <div className="space-y-4">
          <DataList
            rows={result.data.items}
            href={(site) => `/sites/${site.id}`}
            card={(site) => ({
              title: site.name,
              subtitle: site.code,
              badge: <SiteBadges site={site} />,
              meta: `${place(site)} · ${site.incharge ? fullName(site.incharge) : "No in-charge"}`,
            })}
            columns={[
              { header: "Name", cell: (site) => site.name },
              { header: "Code", cell: (site) => site.code },
              { header: "Location", cell: place },
              {
                header: "In charge",
                cell: (site) =>
                  site.incharge ? fullName(site.incharge) : "Nobody",
              },
              { header: "Status", cell: (site) => <SiteBadges site={site} /> },
            ]}
          />
          <Pagination path="/sites" query={query} {...result.data} />
        </div>
      </ListBody>
    </ListTransition>
  );
}

export default function SitesPage({ searchParams }: PageProps<"/sites">) {
  return (
    <PageLayout
      title="Sites"
      actions={
        <Suspense>
          <AddSiteLink />
        </Suspense>
      }
    >
      <Suspense fallback={<ListSkeleton filters={false} />}>
        <SiteList searchParams={searchParams} />
      </Suspense>
    </PageLayout>
  );
}
