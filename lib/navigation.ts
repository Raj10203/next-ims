import {
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { href: string; label: string };

export type AppModule = NavLink & { icon: LucideIcon; tabs: NavLink[] };

export const modules: AppModule[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tabs: [] },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Package,
    tabs: [
      { href: "/inventory", label: "Items" },
      { href: "/inventory/products", label: "Products" },
      { href: "/inventory/categories", label: "Categories" },
    ],
  },
  { href: "/sites", label: "Sites", icon: MapPin, tabs: [] },
  {
    href: "/people",
    label: "People",
    icon: Users,
    tabs: [
      { href: "/people", label: "Users" },
      { href: "/people/invitations", label: "Invitations" },
      { href: "/people/roles", label: "Roles" },
    ],
  },
  { href: "/audit", label: "Audit log", icon: ClipboardList, tabs: [] },
];

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
