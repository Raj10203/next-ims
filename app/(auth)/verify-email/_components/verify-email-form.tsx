"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CodeInput,
  FormMessage,
  SubmitLabel,
  secondaryClass,
  submitClass,
} from "@/components/form";
import { formError, type FormState } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { loginUrl, verifyEmailUrl } from "@/lib/paths";
import { field, useFormSubmit } from "@/lib/use-form-submit";

type Message = { message: string };

// next is already checked by the page (safeNext).
export function VerifyEmailForm({
  email,
  next,
}: {
  email: string;
  next: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"send" | "code">("send");
  const [state, setState] = useState<FormState>({});

  const { pending, onSubmit } = useFormSubmit(async (form, intent) => {
    const result =
      intent === "send"
        ? await callApi<Message>("/auth/email-otp/send")
        : await callApi<Message>("/auth/email-otp/verify", {
            body: { otp: field(form, "otp") },
          });

    // 409: already verified (in another tab, for instance).
    if (
      (result.ok && intent !== "send") ||
      (!result.ok && result.error.statusCode === 409)
    ) {
      return router.replace(next);
    }
    if (!result.ok && result.error.statusCode === 401) {
      return router.replace(loginUrl(verifyEmailUrl(next)));
    }
    if (result.ok) {
      setStep("code");
      return setState({ tone: "info", message: result.data.message });
    }
    // 429 on send is the resend cooldown: a code went out moments ago.
    if (intent === "send" && result.error.statusCode === 429) setStep("code");
    setState(formError(result.error, ["otp"]));
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />

      {step === "send" ? (
        <>
          <p className="text-sm">
            We will email a 6-digit code to{" "}
            <span className="font-medium break-all">{email}</span>.
          </p>
          <button
            type="submit"
            value="send"
            disabled={pending}
            className={submitClass}
          >
            <SubmitLabel
              pending={pending}
              label="Email me a code"
              pendingLabel="Sending…"
            />
          </button>
        </>
      ) : (
        <>
          <CodeInput
            hint={`The code sent to ${email}. It expires in 10 minutes.`}
            error={state.fieldErrors?.otp}
          />
          <button type="submit" disabled={pending} className={submitClass}>
            <SubmitLabel
              pending={pending}
              label="Verify email"
              pendingLabel="Checking…"
            />
          </button>
          <button
            type="submit"
            value="send"
            formNoValidate
            disabled={pending}
            className={secondaryClass}
          >
            Send a new code
          </button>
        </>
      )}
    </form>
  );
}
