import Link from "next/link";
import { Logo } from "@/components/logo";

export function Brand() {
  return (
    <Link
      href="/"
      className="flex min-h-11 items-center gap-2 rounded-md font-semibold"
    >
      <Logo className="h-8 max-w-32" />
      IMS
    </Link>
  );
}
