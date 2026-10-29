import { ArrowRight } from "lucide-react";

// Fixed, not a choice: nest-ims always sends a request from headquarters to
// the requester's own site.
export function RequestRoute({ to }: { to: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        <span className="sr-only">From </span>Headquarters
      </span>
      <ArrowRight aria-hidden="true" className="size-4 text-muted" />
      <span>
        <span className="sr-only">to </span>
        {to}
      </span>
    </p>
  );
}
