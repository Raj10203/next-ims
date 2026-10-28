import { FilterForm } from "@/components/filter-form";
import { SelectField, TextField } from "@/components/form";
import { SearchSelect } from "@/components/search-select";
import { roleLabel } from "@/lib/auth";
import type { PickerOption } from "@/lib/pickers";
import { statusLabel } from "./user-status-badge";
import { statuses, type RoleOption, type UserQuery } from "@/lib/users";

export function UserFilters({
  action,
  query,
  roles,
  site,
  showStatus,
}: {
  action: string;
  query: UserQuery;
  roles: RoleOption[] | null;
  // undefined when the role may not list sites.
  site: PickerOption<"site"> | null | undefined;
  showStatus: boolean;
}) {
  return (
    <FilterForm
      action={action}
      query={showStatus ? query : { ...query, status: undefined }}
    >
      <div className="sm:col-span-2 lg:col-span-4">
        <TextField
          id="search"
          label="Search"
          type="search"
          placeholder="Name or email"
          maxLength={150}
          defaultValue={query.search}
        />
      </div>
      {showStatus && (
        <SelectField
          id="status"
          label="Status"
          defaultValue={query.status ?? ""}
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </SelectField>
      )}
      {roles && (
        <SelectField id="roleId" label="Role" defaultValue={query.roleId ?? ""}>
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {roleLabel(role.name)}
            </option>
          ))}
        </SelectField>
      )}
      {site !== undefined && (
        <SearchSelect
          id="siteId"
          label="Site"
          kind="site"
          value={site}
          emptyLabel="All sites"
        />
      )}
    </FilterForm>
  );
}
