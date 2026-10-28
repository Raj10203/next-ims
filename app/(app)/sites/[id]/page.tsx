import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { DeleteButton } from "@/components/delete-button";
import { outlineClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { DetailList, Section } from "@/components/section";
import { DetailSkeleton, LoadError, NotFoundState } from "@/components/states";
import { ActiveBadge, StatusBadge } from "@/components/status-badge";
import { historyHref } from "@/lib/audit";
import { can, fullName, getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getSite, siteAddress } from "@/lib/sites";
import { inchargePicker } from "../_components/incharge-options";
import { SiteForm } from "../_components/site-form";

export const metadata: Metadata = { title: "Site" };

function NotFound() {
  return (
    <NotFoundState title="Site not found" href="/sites" label="Back to sites" />
  );
}

async function SiteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return <NotFound />;

  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const result = await getSite(id);
  if (!result.ok) {
    return result.error.statusCode === 404 ? (
      <NotFound />
    ) : (
      <LoadError error={result.error} />
    );
  }

  const site = result.data;
  const hq = site.type === "hq";
  const update = can(actor.data, "update", "Site");
  const incharges = update
    ? await inchargePicker(actor.data, site.incharge)
    : null;
  const links = [
    can(actor.data, "read", "User") && {
      href: `/people?siteId=${site.id}`,
      label: "Users here",
    },
    can(actor.data, "read", "Item") && {
      href: `/inventory?siteId=${site.id}`,
      label: "Stock here",
    },
    can(actor.data, "read", "AuditLog") && {
      href: historyHref("Site", site.id),
      label: "History",
    },
  ].filter((link) => !!link);

  return (
    <div className="space-y-6">
      <PageHeader title={site.name} description={site.code}>
        <span className="flex flex-wrap gap-1.5">
          {hq && <StatusBadge tone="info">Headquarters</StatusBadge>}
          <ActiveBadge active={site.isActive} />
        </span>
      </PageHeader>

      <Section id="overview" title="Overview">
        <DetailList
          rows={[
            ["Address", siteAddress(site) || "Not set"],
            ["In charge", site.incharge ? fullName(site.incharge) : "Nobody"],
            [
              "Added",
              site.createdBy
                ? `${formatDate(site.createdAt)} by ${fullName(site.createdBy)}`
                : formatDate(site.createdAt),
            ],
          ]}
        />
        {links.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={outlineClass}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </Section>

      {update && (
        <Section id="details" title="Details">
          <SiteForm
            site={{
              id: site.id,
              name: site.name,
              code: site.code,
              address: site.address,
              city: site.city,
              state: site.state,
              pincode: site.pincode,
              isActive: site.isActive,
            }}
            incharges={incharges}
          />
        </Section>
      )}

      {!hq && can(actor.data, "delete", "Site") && (
        <Section
          id="delete"
          title="Delete site"
          description="Only a site without users, stock or stock history can be deleted. Otherwise, mark it inactive."
        >
          <DeleteButton
            path={`/sites/${site.id}`}
            title={`Delete ${site.name}?`}
            description="The site is removed. This cannot be undone."
            label="Delete site"
            redirectTo="/sites"
          />
        </Section>
      )}
    </div>
  );
}

export default function SitePage({ params }: PageProps<"/sites/[id]">) {
  return (
    <div className="space-y-6">
      <BackLink href="/sites" label="Sites" />
      <Suspense fallback={<DetailSkeleton />}>
        <SiteDetail params={params} />
      </Suspense>
    </div>
  );
}
