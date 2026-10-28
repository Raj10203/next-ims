import { useTransition, type FormEvent } from "react";

// For forms that send JSON through lib/client-api.ts. intent is the value of
// the button that submitted the form, for forms with two actions. pending
// stays true until the handler is done, including a navigation it starts.
export function useFormSubmit(
  handler: (form: HTMLFormElement, intent: string | null) => Promise<void>,
) {
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const { submitter } = event.nativeEvent as SubmitEvent;
    const intent =
      submitter instanceof HTMLButtonElement ? submitter.value || null : null;
    startTransition(() => handler(form, intent));
  }

  return { pending, onSubmit };
}

export function field(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

// Empty clears the value: the API takes null for "none".
export function optionalField(form: HTMLFormElement, name: string) {
  return field(form, name).trim() || null;
}

export function optionalNumber(form: HTMLFormElement, name: string) {
  const value = optionalField(form, name);
  return value === null ? null : Number(value);
}

export function checked(form: HTMLFormElement, name: string) {
  return new FormData(form).has(name);
}
