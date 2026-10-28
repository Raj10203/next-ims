import "server-only";
import type { Option } from "@/components/form";
import { can, fullName, type ApiUser } from "@/lib/auth";
import type { PersonSummary } from "@/lib/sites";
import { listAssignableRoles, listUsers } from "@/lib/users";

// nest-ims accepts an active site_incharge within the actor's user scope, which
// is what GET /users returns. The role id comes from GET /roles (create User).
export async function inchargeOptions(
  actor: ApiUser,
  current: PersonSummary | null = null,
): Promise<Option[] | null> {
  if (!can(actor, "create", "User")) return null;
  const roles = await listAssignableRoles();
  const role = roles.ok
    ? roles.data.find((option) => option.name === "site_incharge")
    : undefined;
  if (!role) return null;

  const users = await listUsers({
    roleId: String(role.id),
    status: "active",
    limit: "100",
  });
  if (!users.ok) return null;
  const options = users.data.items.map((user) => ({
    id: user.id,
    label: `${fullName(user)} (${user.email})`,
  }));
  if (current && !options.some((option) => option.id === current.id)) {
    options.unshift({ id: current.id, label: fullName(current) });
  }
  return options;
}
