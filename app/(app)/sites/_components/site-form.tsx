"use client";

import { useRouter } from "next/navigation";
import {
  CheckboxField,
  FormMessage,
  SelectField,
  SubmitLabel,
  TextField,
  submitClass,
  type Option,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import {
  checked,
  field,
  optionalField,
  optionalNumber,
} from "@/lib/use-form-submit";

const fields = [
  "name",
  "code",
  "address",
  "city",
  "state",
  "pincode",
  "inchargeId",
  "isActive",
];

export type EditedSite = {
  id: number;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  isActive: boolean;
  inchargeId: number | null;
};

// incharges is null when the user may not list site in-charges; the field is
// then left out and the API keeps the current one.
export function SiteForm({
  site,
  incharges,
}: {
  site?: EditedSite;
  incharges: Option[] | null;
}) {
  const router = useRouter();

  const { state, pending, onSubmit } = useApiForm(
    (form) => {
      const body = {
        name: field(form, "name"),
        code: field(form, "code"),
        address: optionalField(form, "address"),
        city: optionalField(form, "city"),
        state: optionalField(form, "state"),
        pincode: optionalField(form, "pincode"),
        isActive: checked(form, "isActive"),
        ...(incharges && { inchargeId: optionalNumber(form, "inchargeId") }),
      };
      return site
        ? callApi<{ id: number }>(`/sites/${site.id}`, {
            method: "PATCH",
            body,
          })
        : callApi<{ id: number }>("/sites", { body });
    },
    {
      fields,
      refresh: !!site,
      onSuccess(saved) {
        if (!site) return router.push(`/sites/${saved.id}`);
        return { tone: "success", message: "Saved." };
      },
    },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="name"
          label="Name"
          required
          maxLength={150}
          defaultValue={site?.name}
          error={errors.name}
        />
        <TextField
          id="code"
          label="Code"
          required
          maxLength={50}
          autoCapitalize="characters"
          defaultValue={site?.code}
          hint="Short and unique, such as AMD-01."
          error={errors.code}
        />
        <div className="sm:col-span-2">
          <TextField
            id="address"
            label="Address (optional)"
            maxLength={255}
            autoComplete="street-address"
            defaultValue={site?.address ?? ""}
            error={errors.address}
          />
        </div>
        <TextField
          id="city"
          label="City (optional)"
          maxLength={100}
          autoComplete="address-level2"
          defaultValue={site?.city ?? ""}
          error={errors.city}
        />
        <TextField
          id="state"
          label="State (optional)"
          maxLength={100}
          autoComplete="address-level1"
          defaultValue={site?.state ?? ""}
          error={errors.state}
        />
        <TextField
          id="pincode"
          label="PIN code (optional)"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="postal-code"
          defaultValue={site?.pincode ?? ""}
          error={errors.pincode}
        />
        {incharges && (
          <SelectField
            id="inchargeId"
            label="In charge (optional)"
            defaultValue={site?.inchargeId ?? ""}
            hint="Active users with the site in-charge role."
            error={errors.inchargeId}
          >
            <option value="">Nobody</option>
            {incharges.map((user) => (
              <option key={user.id} value={user.id}>
                {user.label}
              </option>
            ))}
          </SelectField>
        )}
        <div className="sm:col-span-2">
          <CheckboxField
            id="isActive"
            label="Active"
            defaultChecked={site?.isActive ?? true}
            error={errors.isActive}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label={site ? "Save changes" : "Add site"}
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
