import { Check, Circle } from "lucide-react";

// Mirrors passwordSchema in nest-ims as a guide while typing; the API decides,
// and also refuses a password containing the user's name.
const rules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "A capital letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "A small letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "A digit", test: (v: string) => /\d/.test(v) },
  { label: "A symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordRules({
  id,
  password,
}: {
  id: string;
  password: string;
}) {
  return (
    <ul id={id} className="mt-2 space-y-1 text-sm">
      {rules.map(({ label, test }) => {
        const met = test(password);
        const Icon = met ? Check : Circle;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 ${met ? "text-success" : "text-muted"}`}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {label}
            <span className="sr-only">{met ? "(done)" : "(missing)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
