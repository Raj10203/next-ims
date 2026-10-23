import Image from "next/image";

// Read when a page renders; static pages render at build time, so a new value
// needs a rebuild.
const logoUrl = process.env.APP_LOGO_URL || "/logo.svg";

// unoptimized: the browser loads the logo straight from its host. A host that
// only serves this app's domain (Azure Blob) would refuse the image optimizer.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src={logoUrl}
      alt="Company logo"
      width={48}
      height={48}
      unoptimized
      priority
      className={`w-auto object-contain ${className}`}
    />
  );
}
