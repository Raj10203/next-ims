"use client";

import { Avatar } from "@/components/avatar";
import {
  FieldError,
  FormMessage,
  SubmitLabel,
  dangerClass,
  outlineClass,
} from "@/components/form";
import type { ApiResult } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";

// AVATAR_MAX_BYTES and the allowed types in nest-ims, checked here first so a
// wrong file is not uploaded only to be refused.
const MAX_BYTES = 500 * 1024;
const TYPES = ["image/png", "image/jpeg"];

function invalid(message: string): ApiResult<never> {
  return {
    ok: false,
    error: { statusCode: 400, message, errors: [{ path: "file", message }] },
  };
}

export function AvatarForm({
  userId,
  name,
  avatarUrl,
}: {
  userId: number;
  name: string;
  avatarUrl: string | null;
}) {
  const { state, pending, onSubmit } = useApiForm(
    async (form, intent) => {
      if (intent === "remove") {
        return callApi(`/users/${userId}/avatar`, { method: "DELETE" });
      }
      const file = new FormData(form).get("file");
      if (!(file instanceof File) || !file.size) {
        return invalid("Choose a photo.");
      }
      if (!TYPES.includes(file.type)) {
        return invalid("Choose a PNG or JPEG image.");
      }
      if (file.size > MAX_BYTES) {
        return invalid("Choose an image of 500 KB or less.");
      }
      return callApi(`/users/${userId}/avatar`, {
        method: "PUT",
        body: new FormData(form),
      });
    },
    {
      fields: ["file"],
      onSuccess(_, form) {
        form.reset();
      },
    },
  );
  const error = state.fieldErrors?.file;

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-4">
      <Avatar name={name} src={avatarUrl} size="xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            id="avatar-file"
            name="file"
            type="file"
            accept={TYPES.join(",")}
            disabled={pending}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? "avatar-hint avatar-error" : "avatar-hint"
            }
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="peer sr-only"
          />
          <label
            htmlFor="avatar-file"
            className={`${outlineClass} cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:opacity-60`}
          >
            <SubmitLabel
              pending={pending}
              label={avatarUrl ? "Change photo" : "Upload photo"}
              pendingLabel="Saving…"
            />
          </label>
          {avatarUrl && (
            <button
              type="submit"
              value="remove"
              disabled={pending}
              className={dangerClass}
            >
              Remove
            </button>
          )}
        </div>
        <p id="avatar-hint" className="text-sm text-muted">
          PNG or JPEG, up to 500 KB.
        </p>
        <FieldError id="avatar-error" message={error} />
        <FormMessage message={state.message} tone={state.tone} />
      </div>
    </form>
  );
}
