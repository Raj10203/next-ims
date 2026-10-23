import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
