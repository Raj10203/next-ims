import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { submitClass } from "@/components/form";
import { can, getCurrentUser } from "@/lib/auth";
import { ListSkeleton } from "@/components/states";
import { UserDirectory } from "./_components/user-directory";

export const metadata: Metadata = { title: "Users" };

async function AddUserLink() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "create", "User")) return null;
  return (
    <Link href="/people/new" className={`${submitClass} w-auto`}>
      <Plus aria-hidden="true" className="size-4" />
      Add user
    </Link>
  );
}

export default function UsersPage({ searchParams }: PageProps<"/people">) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Users
        </h1>
        <Suspense>
          <AddUserLink />
        </Suspense>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <UserDirectory path="/people" searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
