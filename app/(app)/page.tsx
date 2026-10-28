import {
  Boxes,
  MailOpen,
  MapPin,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { outlineClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { EmptyState, LoadError, TableSkeleton } from "@/components/states";
import type { ApiResult } from "@/lib/api-result";
import { can, getCurrentUser } from "@/lib/auth";
import { listProducts } from "@/lib/catalog";
import { getStock, listItems } from "@/lib/items";
import type { Page } from "@/lib/query";
import { listSites } from "@/lib/sites";
import { listUsers } from "@/lib/users";
import { StockList } from "./_components/stock-list";

export const metadata: Metadata = { title: "Dashboard" };

type Tile = {
  label: string;
  href: string;
  icon: LucideIcon;
  count: Promise<ApiResult<Page<unknown>>>;
};

async function TileCount({ count }: { count: Tile["count"] }) {
  const result = await count;
  return (
    <span className="text-3xl font-semibold tabular-nums">
      {result.ok ? result.data.total : "—"}
    </span>
  );
}

// Each total is one list call with limit=1, so every tile loads on its own.
async function Tiles() {
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const one = { limit: "1" };
  const tiles: Tile[] = [
    can(actor.data, "read", "Item") && {
      label: "Items in stock",
      href: "/inventory",
      icon: Boxes,
      count: listItems(one),
    },
    can(actor.data, "read", "Product") && {
      label: "Products",
      href: "/inventory/products",
      icon: Package,
      count: listProducts({ ...one, isActive: "true" }),
    },
    can(actor.data, "read", "Site") && {
      label: "Sites",
      href: "/sites",
      icon: MapPin,
      count: listSites(one),
    },
    can(actor.data, "read", "User") && {
      label: "Active users",
      href: "/people?status=active",
      icon: Users,
      count: listUsers({ ...one, status: "active" }),
    },
    can(actor.data, "create", "User") && {
      label: "Pending invitations",
      href: "/people/invitations",
      icon: MailOpen,
      count: listUsers({ ...one, status: "invited" }),
    },
  ].filter((tile) => !!tile);

  if (!tiles.length) {
    return (
      <EmptyState
        title="Nothing to show yet"
        description="Your role has no overview here. Use the menu to open your profile."
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map(({ label, href, icon: Icon, count }) => (
        <li key={label}>
          <Link
            href={href}
            className="flex min-h-11 items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0">
              <Suspense
                fallback={
                  <span className="block h-9 w-12 skeleton rounded-md" />
                }
              >
                <TileCount count={count} />
              </Suspense>
              <span className="block text-sm text-muted">{label}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function StockOverview() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "read", "Item")) return null;
  const stock = await getStock({ limit: "100" });

  return (
    <Section
      id="stock"
      title="Stock by product and site"
      action={
        <Link href="/inventory" className={outlineClass}>
          View all
        </Link>
      }
      description={
        stock.ok && stock.data.total > stock.data.items.length
          ? `The first ${stock.data.items.length} of ${stock.data.total} rows.`
          : undefined
      }
    >
      {!stock.ok ? (
        <LoadError error={stock.error} />
      ) : !stock.data.items.length ? (
        <EmptyState
          title="No stock yet"
          description="Counts appear once stock is added."
        />
      ) : (
        <StockList rows={stock.data.items} />
      )}
    </Section>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[0, 1, 2].map((tile) => (
              <div
                key={tile}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <span className="size-11 skeleton rounded-lg" />
                <span className="space-y-2">
                  <span className="block h-7 w-12 skeleton rounded-md" />
                  <span className="block h-3 w-24 skeleton rounded-md" />
                </span>
              </div>
            ))}
          </div>
        }
      >
        <Tiles />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <StockOverview />
      </Suspense>
    </div>
  );
}
