import { LoaderCircle } from "lucide-react";

export type FormTone = "error" | "info" | "success";

export const inputClass =
  "mt-1.5 block min-h-11 w-full rounded-lg border border-input bg-surface px-3 aria-invalid:border-danger";

export const submitClass =
  "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60";

export const outlineClass =
  "flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-surface-muted disabled:opacity-60";

export const dangerClass =
  "flex min-h-11 items-center justify-center gap-2 rounded-lg border border-danger/40 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-60";

export const secondaryClass =
  "min-h-11 w-full rounded-lg text-sm font-medium text-muted hover:text-foreground disabled:opacity-60";

const tones: Record<FormTone, string> = {
  error: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
};

export function FormMessage({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: FormTone;
}) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3 py-2.5 text-sm ${tones[tone]}`}
    >
      {message}
    </p>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {message}
    </p>
  );
}

export type Option = { id: number; label: string };

type FieldProps = { id: string; label: string; error?: string; hint?: string };

export function describedBy(id: string, error?: string, hint?: string) {
  return (
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined
  );
}

export function FieldText({ id, label, hint }: Omit<FieldProps, "error">) {
  return (
    <>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </>
  );
}

export function TextField({
  id,
  label,
  error,
  hint,
  name = id,
  ...input
}: FieldProps & React.ComponentProps<"input">) {
  return (
    <div>
      <FieldText id={id} label={label} hint={hint} />
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={inputClass}
        {...input}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  hint,
  name = id,
  children,
  ...select
}: FieldProps & React.ComponentProps<"select">) {
  return (
    <div>
      <FieldText id={id} label={label} hint={hint} />
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={inputClass}
        {...select}
      >
        {children}
      </select>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  error,
  hint,
  name = id,
  ...textarea
}: FieldProps & React.ComponentProps<"textarea">) {
  return (
    <div>
      <FieldText id={id} label={label} hint={hint} />
      <textarea
        id={id}
        name={name}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${inputClass} py-2`}
        {...textarea}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function CheckboxField({
  id,
  label,
  error,
  hint,
  name = id,
  ...input
}: FieldProps & Omit<React.ComponentProps<"input">, "type">) {
  return (
    <div>
      <div className="flex min-h-11 items-center gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className="size-5 shrink-0 accent-primary"
          {...input}
        />
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function SubmitLabel({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <>
      {pending && (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      )}
      {pending ? pendingLabel : label}
    </>
  );
}

export function CodeInput({
  hint,
  error,
}: {
  hint: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor="otp" className="text-sm font-medium">
        6-digit code
      </label>
      <p id="otp-hint" className="mt-1 text-sm text-muted">
        {hint}
      </p>
      <input
        id="otp"
        name="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "otp-hint otp-error" : "otp-hint"}
        className={`${inputClass} font-mono tracking-[0.5em]`}
      />
      <FieldError id="otp-error" message={error} />
    </div>
  );
}
