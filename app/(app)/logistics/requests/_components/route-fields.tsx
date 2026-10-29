"use client";

import { useState } from "react";
import { SearchSelect } from "@/components/search-select";
import type { PickerOption } from "@/lib/pickers";

export type RouteValue = {
  from: PickerOption<"site"> | null;
  to: PickerOption<"site"> | null;
  assignee: PickerOption<"assignee"> | null;
};

// HQ's choice of sites and assignee, shared by the new request form and the
// route form. The assignee must work at the receiving site, so a new "to"
// clears it and its picker searches that site only.
// fromDefault names what an empty "from" means (headquarters, when raising);
// without it "from" must be chosen, since an empty field keeps the current
// site when the route changes.
export function RouteFields({
  initial,
  onChange,
  fromDefault,
  errors = {},
}: {
  initial: RouteValue;
  onChange: (route: RouteValue) => void;
  fromDefault?: string;
  errors?: Record<string, string>;
}) {
  const [route, setRoute] = useState(initial);
  const change = (next: RouteValue) => {
    setRoute(next);
    onChange(next);
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <SearchSelect
        id="fromSiteId"
        label="From"
        kind="site"
        required={!fromDefault}
        value={route.from}
        emptyLabel={fromDefault}
        placeholder="Choose the sending site"
        hint="Where the stock is packed."
        onSelect={(from) => change({ ...route, from })}
        error={errors.fromSiteId}
      />
      <SearchSelect
        id="siteId"
        label="To"
        required
        kind="site"
        value={route.to}
        placeholder="Choose the receiving site"
        hint="Where the stock is delivered."
        onSelect={(to) =>
          change({
            ...route,
            to,
            assignee: to?.id === route.to?.id ? route.assignee : null,
          })
        }
        error={errors.siteId}
      />
      <div className="sm:col-span-2">
        {route.to ? (
          <SearchSelect
            // A new site starts a new search.
            key={route.to.id}
            id="assigneeId"
            label="Assignee (optional)"
            kind="assignee"
            params={{ siteId: String(route.to.id) }}
            value={route.assignee}
            emptyLabel="Nobody"
            hint={`An employee of ${route.to.label} who owns the request there: notified, and may cancel it.`}
            onSelect={(assignee) => change({ ...route, assignee })}
            error={errors.assigneeId}
          />
        ) : (
          <p className="text-sm text-muted">
            Choose the receiving site to assign one of its employees.
          </p>
        )}
      </div>
    </div>
  );
}
