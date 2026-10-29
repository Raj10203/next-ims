"use client";

import { useState } from "react";
import { FormMessage, SubmitLabel, submitClass } from "@/components/form";
import { SearchSelect } from "@/components/search-select";
import { callApi } from "@/lib/client-api";
import type { PickerOption } from "@/lib/pickers";
import { useApiForm } from "@/lib/use-api-form";
import { RouteFields, type RouteValue } from "./route-fields";

// HQ's change of sites or assignee, offered while nest-ims allows it
// (allowed.route: until the request is packed). A new receiving site also
// needs a new requester there: nest-ims keeps the requester at the site the
// stock goes to.
export function RouteForm({
  requestId,
  initial,
}: {
  requestId: number;
  initial: RouteValue;
}) {
  const [route, setRoute] = useState(initial);
  const [requester, setRequester] = useState<PickerOption<"assignee"> | null>(
    null,
  );
  const moved = !!route.to && route.to.id !== initial.to?.id;
  const { state, pending, onSubmit } = useApiForm(
    () =>
      callApi(`/stock-requests/${requestId}/route`, {
        method: "PATCH",
        body: {
          fromSiteId: route.from?.id,
          siteId: route.to?.id,
          // null removes the assignee.
          assigneeId: route.assignee?.id ?? null,
          ...(moved && { requestedById: requester?.id }),
        },
      }),
    {
      fields: ["fromSiteId", "siteId", "assigneeId", "requestedById"],
      onSuccess: () => ({ tone: "success", message: "Route saved." }),
    },
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      <RouteFields
        initial={initial}
        onChange={setRoute}
        errors={state.fieldErrors}
      />
      {moved && route.to && (
        <SearchSelect
          // Each new site starts a new search.
          key={route.to.id}
          id="requestedById"
          label="Requester at the new site"
          required
          kind="assignee"
          params={{ siteId: String(route.to.id) }}
          value={requester}
          placeholder="Choose who requests it there"
          hint={`The request moves to ${route.to.label}, so one of its employees takes it over: they see it, are notified, and may cancel it.`}
          onSelect={setRequester}
          error={state.fieldErrors?.requestedById}
        />
      )}
      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label="Save route"
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
