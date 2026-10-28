"use client";

import { useRouter } from "next/navigation";
import {
  CheckboxField,
  FormMessage,
  SubmitLabel,
  TextAreaField,
  TextField,
  submitClass,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import { checked, field, optionalField } from "@/lib/use-form-submit";

const fields = ["name", "description", "isActive"];

export type EditedCategory = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export function CategoryForm({ category }: { category?: EditedCategory }) {
  const router = useRouter();

  const { state, pending, onSubmit } = useApiForm(
    (form) => {
      const body = {
        name: field(form, "name"),
        description: optionalField(form, "description"),
        isActive: checked(form, "isActive"),
      };
      return category
        ? callApi<{ id: number }>(`/categories/${category.id}`, {
            method: "PATCH",
            body,
          })
        : callApi<{ id: number }>("/categories", { body });
    },
    {
      fields,
      refresh: !!category,
      onSuccess(saved) {
        if (!category) return router.push(`/inventory/categories/${saved.id}`);
        return { tone: "success", message: "Saved." };
      },
    },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      <TextField
        id="name"
        label="Name"
        required
        maxLength={100}
        defaultValue={category?.name}
        error={errors.name}
      />
      <TextAreaField
        id="description"
        label="Description (optional)"
        maxLength={500}
        defaultValue={category?.description ?? ""}
        error={errors.description}
      />
      <CheckboxField
        id="isActive"
        label="Active"
        defaultChecked={category?.isActive ?? true}
        hint="Inactive categories stay on their products but are not offered for new ones."
        error={errors.isActive}
      />
      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label={category ? "Save changes" : "Add category"}
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
