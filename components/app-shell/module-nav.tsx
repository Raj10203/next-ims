"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findActive, visibleModules } from "@/lib/navigation";

// These read the URL, so the shell wraps them in Suspense: on a route with an
// unknown dynamic param, usePathname suspends while prerendering. hidden is
// the links the user's role may not open (components/app-shell/user-nav.tsx).

export function ModuleNav({
  pathname = "",
  hidden,
}: {
  pathname?: string;
  hidden?: string[];
}) {
  const modules = visibleModules(hidden);
  const active = findActive(modules, pathname);

  return (
    <ul className="space-y-1">
      {modules.map(({ href, target, label, icon: Icon }) => (
        <li key={href}>
          <Link
            href={target}
            aria-current={href === active?.href ? "page" : undefined}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary"
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ActiveModuleNav({ hidden }: { hidden?: string[] }) {
  return <ModuleNav pathname={usePathname()} hidden={hidden} />;
}

export function ModuleTitle() {
  const active = findActive(visibleModules(), usePathname());
  return (
    <span className="truncate text-base font-semibold">
      {active?.label ?? "IMS"}
    </span>
  );
}

export function ModuleTabs({
  className = "",
  hidden,
}: {
  className?: string;
  hidden?: string[];
}) {
  const pathname = usePathname();
  const active = findActive(visibleModules(hidden), pathname);
  if (!active?.tabs.length) return null;
  const activeTab = findActive(active.tabs, pathname);

  return (
    <nav aria-label={`${active.label} sections`} className={className}>
      <ul className="flex gap-1 overflow-x-auto">
        {active.tabs.map((tab) => (
          <li key={tab.href} className="shrink-0">
            <Link
              href={tab.href}
              aria-current={tab.href === activeTab?.href ? "page" : undefined}
              className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-foreground aria-[current=page]:bg-surface-muted aria-[current=page]:text-foreground"
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
