const sizes = { sm: "size-8 text-xs", lg: "size-12 text-base" };

// The API sends avatarUrl: null when there is no photo; initials stand in.
export function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: keyof typeof sizes;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary ${sizes[size]}`}
    >
      {initials}
    </span>
  );
}
