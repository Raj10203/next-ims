import { Menu } from "lucide-react";
import { Suspense } from "react";
import {
  AccountPanel,
  type ShellUser,
} from "@/components/app-shell/account-panel";
import { Brand } from "@/components/app-shell/brand";
import {
  ActiveModuleNav,
  ModuleNav,
  ModuleTabs,
  ModuleTitle,
} from "@/components/app-shell/module-nav";
import { Avatar } from "@/components/avatar";
import { Drawer } from "@/components/drawer";
import { ThemeToggle } from "@/components/theme-toggle";

// Placeholder until sign-in exists; it will come from GET /api/auth/me.
const user: ShellUser = {
  name: "Demo User",
  email: "demo@ims.local",
  role: "Site technician",
  site: "Headquarters",
};

const moduleNav = (
  <nav aria-label="Modules">
    <Suspense fallback={<ModuleNav />}>
      <ActiveModuleNav />
    </Suspense>
  </nav>
);

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3"
      >
        Skip to content
      </a>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-3">{moduleNav}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-2 sm:px-4 lg:h-16 lg:gap-6 lg:px-6">
            <Drawer
              side="left"
              label="Menu"
              title={<Brand />}
              trigger={<Menu aria-hidden="true" className="size-6" />}
              triggerClassName="lg:hidden"
            >
              {moduleNav}
            </Drawer>
            <div className="min-w-0">
              <Suspense>
                <ModuleTitle />
              </Suspense>
            </div>
            <Suspense>
              <ModuleTabs className="hidden min-w-0 lg:block" />
            </Suspense>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
              <Drawer
                side="right"
                label="Account"
                trigger={<Avatar name={user.name} />}
              >
                <AccountPanel user={user} />
              </Drawer>
            </div>
          </div>
          <Suspense>
            <ModuleTabs className="border-t border-border px-2 sm:px-4 lg:hidden" />
          </Suspense>
        </header>

        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
