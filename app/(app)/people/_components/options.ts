import type { Option } from "@/components/form";
import { roleLabel } from "@/lib/auth";
import type { SiteOption } from "@/lib/sites";
import type { RoleOption } from "@/lib/users";

// Client forms get ready-made labels: lib/auth is server-only.

export function roleOptions(roles: RoleOption[]): Option[] {
  return roles.map((role) => ({ id: role.id, label: roleLabel(role.name) }));
}

export function siteLabels(sites: SiteOption[]): Option[] {
  return sites.map((site) => ({
    id: site.id,
    label: site.code ? `${site.name} (${site.code})` : site.name,
  }));
}
