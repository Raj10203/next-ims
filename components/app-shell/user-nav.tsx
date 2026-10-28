import { ActiveModuleNav, ModuleTabs } from "@/components/app-shell/module-nav";
import { can, getCurrentUser } from "@/lib/auth";
import { modules } from "@/lib/navigation";

// Hiding only spares the user dead ends; the API authorizes every call. If
// the user cannot be loaded, everything shows and the pages explain.
async function hiddenLinks() {
  const user = await getCurrentUser();
  if (!user.ok) return [];
  return modules
    .flatMap((module) => [module, ...module.tabs])
    .filter((link) => link.requires && !can(user.data, ...link.requires))
    .map((link) => link.href);
}

export async function UserModuleNav() {
  return <ActiveModuleNav hidden={await hiddenLinks()} />;
}

export async function UserModuleTabs({ className }: { className?: string }) {
  return <ModuleTabs className={className} hidden={await hiddenLinks()} />;
}
