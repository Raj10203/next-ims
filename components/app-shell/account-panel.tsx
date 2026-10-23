import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth-actions";

export type ShellUser = { name: string; email: string; role: string };

const links = [
  { href: "/profile", label: "My profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

const row =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium";

export function AccountPanel({
  user,
  error,
}: {
  user: ShellUser | null;
  error?: string;
}) {
  return (
    <div className="space-y-4">
      {user ? (
        <div className="flex items-center gap-3 px-3">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
            <p className="truncate text-xs text-muted">{user.role}</p>
          </div>
        </div>
      ) : (
        <p
          role="alert"
          className="mx-3 rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          {error ??
            "Your account details could not be loaded. Reload the page to try again."}
        </p>
      )}

      <ul className="space-y-1 border-t border-border pt-4">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`${row} text-muted transition-colors hover:bg-surface-muted hover:text-foreground`}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border px-3 pt-4">
        <span className="text-sm font-medium">Theme</span>
        <ThemeToggle />
      </div>

      <form action={logout} className="border-t border-border pt-4">
        <button
          type="submit"
          className={`${row} text-danger transition-colors hover:bg-danger/10`}
        >
          <LogOut aria-hidden="true" className="size-5" />
          Sign out
        </button>
      </form>
    </div>
  );
}
