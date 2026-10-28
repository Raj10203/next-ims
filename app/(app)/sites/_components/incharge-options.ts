import "server-only";
import { can, type ApiUser } from "@/lib/auth";
import { toPickerOption } from "@/lib/pickers";
import type { PersonSummary } from "@/lib/sites";
import { listAssignableRoles } from "@/lib/users";
import type { InchargePicker } from "./site-form";

// nest-ims accepts an active site_incharge within the actor's user scope, which
// is what GET /users returns. The role id comes from GET /roles (create User).
export async function inchargePicker(
  actor: ApiUser,
  current: PersonSummary | null = null,
): Promise<InchargePicker | null> {
  if (!can(actor, "create", "User")) return null;
  const roles = await listAssignableRoles();
  const role = roles.ok
    ? roles.data.find((option) => option.name === "site_incharge")
    : undefined;
  if (!role) return null;
  return {
    roleId: String(role.id),
    current: current && toPickerOption("user", current),
  };
}
