import type { Option } from "@/components/form";
import { roleLabel } from "@/lib/auth";
import type { RoleOption } from "@/lib/users";

// Client forms get ready-made labels: lib/auth is server-only.

export function roleOptions(roles: RoleOption[]): Option[] {
  return roles.map((role) => ({ id: role.id, label: roleLabel(role.name) }));
}
