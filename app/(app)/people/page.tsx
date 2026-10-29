import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageLayout } from "@/components/page-layout";
import { submitClass } from "@/components/form";
import { can, getCurrentUser } from "@/lib/auth";
import { ListSkeleton } from "@/components/states";
import { UserDirectory } from "./_components/user-directory";

export const metadata: Metadata = { title: "Users" };

async function AddUserLink() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "create", "User")) return null;
  return (
    <Link href="/people/new" className={`${submitClass} sm:w-auto`}>
      <Plus aria-hidden="true" className="size-4" />
      Add user
    </Link>
  );
}

export default function UsersPage({ searchParams }: PageProps<"/people">) {
  return (
    <PageLayout
      title="Users"
      actions={
        <Suspense>
          <AddUserLink />
        </Suspense>
      }
    >
      <Suspense fallback={<ListSkeleton />}>
        <UserDirectory path="/people" searchParams={searchParams} />
      </Suspense>
    </PageLayout>
  );
}
