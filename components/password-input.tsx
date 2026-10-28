"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FieldError, inputClass } from "@/components/form";

export function PasswordInput({
  id,
  name = id,
  label,
  autoComplete,
  error,
  hintId,
  onChange,
}: {
  id: string;
  name?: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hintId?: string;
  onChange?: (value: string) => void;
}) {
  const [shown, setShown] = useState(false);
  const errorId = `${id}-error`;
  const describedBy =
    [hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={onChange && ((event) => onChange(event.target.value))}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          onClick={() => setShown((value) => !value)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted hover:text-foreground"
        >
          {shown ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
