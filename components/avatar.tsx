import { UserRound } from "lucide-react";
import Image from "next/image";

const sizes = {
  sm: { className: "size-8 text-xs", pixels: 32 },
  lg: { className: "size-12 text-base", pixels: 48 },
  xl: { className: "size-20 text-2xl", pixels: 80 },
};

// The API sends avatarUrl: null when there is no photo; initials stand in.
// unoptimized: the photo is on Azure Blob, like the logo (components/logo.tsx).
export function Avatar({
  name,
  src,
  size = "sm",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
}) {
  const { className, pixels } = sizes[size];

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={pixels}
        height={pixels}
        unoptimized
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary ${className}`}
    >
      {initials || <UserRound className="size-1/2" />}
    </span>
  );
}
