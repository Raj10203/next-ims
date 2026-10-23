import { AccountPanel } from "@/components/app-shell/account-panel";
import { Avatar } from "@/components/avatar";
import { Drawer } from "@/components/drawer";
import { fullName, getCurrentUser, roleLabel } from "@/lib/auth";

export async function AccountMenu() {
  const result = await getCurrentUser();
  const user = result.ok ? result.data : null;
  const name = user ? fullName(user) : "";
  // A reload will not fix a 4xx (such as 429), so show the API's message.
  const error =
    !result.ok &&
    result.error.statusCode >= 400 &&
    result.error.statusCode < 500
      ? result.error.message
      : undefined;

  return (
    <Drawer side="right" label="Account" trigger={<Avatar name={name} />}>
      <AccountPanel
        user={
          user && { name, email: user.email, role: roleLabel(user.role.name) }
        }
        error={error}
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
