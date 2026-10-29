import {
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

// [action, subject] as in nest-ims permissions, or a list of which any one
// will do; without it, everyone sees it.
export type Permission = [action: string, subject: string];

export type NavLink = {
  href: string;
  label: string;
  requires?: Permission | Permission[];
};

export type AppModule = NavLink & { icon: LucideIcon; tabs: NavLink[] };

export const modules: AppModule[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tabs: [] },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Package,
    tabs: [
      { href: "/inventory", label: "Stock", requires: ["read", "Item"] },
      { href: "/inventory/items", label: "Items", requires: ["read", "Item"] },
      {
        href: "/inventory/products",
        label: "Products",
        requires: ["read", "Product"],
      },
      {
        href: "/inventory/categories",
        label: "Categories",
        requires: ["read", "Category"],
      },
    ],
  },
  {
    href: "/logistics",
    label: "Logistics",
    icon: Truck,
    tabs: [
      {
        href: "/logistics",
        label: "To review",
        requires: [
          ["review", "StockRequest"],
          ["approve", "StockRequest"],
        ],
      },
      {
        href: "/logistics/requests",
        label: "Requests",
        requires: ["read", "StockRequest"],
      },
      {
        href: "/logistics/movements",
        label: "Movements",
        requires: ["read", "Item"],
      },
    ],
  },
  {
    href: "/sites",
    label: "Sites",
    icon: MapPin,
    tabs: [],
    requires: ["read", "Site"],
  },
  {
    href: "/people",
    label: "People",
    icon: Users,
    tabs: [
      { href: "/people", label: "Users", requires: ["read", "User"] },
      {
        href: "/people/invitations",
        label: "Invitations",
        requires: ["create", "User"],
      },
      { href: "/people/roles", label: "Roles", requires: ["create", "User"] },
    ],
  },
  {
    href: "/audit",
    label: "Audit log",
    icon: ClipboardList,
    tabs: [],
    requires: ["read", "AuditLog"],
  },
];

export type VisibleModule = AppModule & { target: string };

// A module with tabs opens on its first visible tab, and disappears with
// them; href stays the base path that marks it active.
export function visibleModules(hidden: string[] = []): VisibleModule[] {
  return modules.flatMap((module) => {
    if (!module.tabs.length) {
      return hidden.includes(module.href)
        ? []
        : [{ ...module, target: module.href }];
    }
    const tabs = module.tabs.filter((tab) => !hidden.includes(tab.href));
    return tabs.length ? [{ ...module, tabs, target: tabs[0].href }] : [];
  });
}

function matches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Longest match wins, so /inventory/products selects Products, not Items.
export function findActive<T extends NavLink>(links: T[], pathname: string) {
  return links
    .filter((link) => matches(pathname, link.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
