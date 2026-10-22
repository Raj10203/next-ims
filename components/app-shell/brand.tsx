import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      className="flex min-h-11 items-center gap-2 rounded-md font-semibold"
    >
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground"
      >
        IM
      </span>
      IMS
    </Link>
  );
}
