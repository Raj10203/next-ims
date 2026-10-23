import { AccountPanel } from "@/components/app-shell/account-panel";
import { Avatar } from "@/components/avatar";
import { Drawer } from "@/components/drawer";
import { fullName, getCurrentUser, roleLabel } from "@/lib/auth";

export async function AccountMenu() {
  const user = await getCurrentUser();
  const name = user ? fullName(user) : "";

  return (
    <Drawer side="right" label="Account" trigger={<Avatar name={name} />}>
      <AccountPanel
        user={
          user && { name, email: user.email, role: roleLabel(user.role.name) }
        }
      />
    </Drawer>
  );
}

export function AccountMenuSkeleton() {
  return (
    <span className="flex size-11 items-center justify-center">
      <span className="size-8 animate-pulse rounded-full bg-surface-muted" />
    </span>
  );
}
