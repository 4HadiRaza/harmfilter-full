import { getUserDetail } from "@/app/actions/users";
import { getCurrentAdmin } from "@/app/actions/auth";
import { UserDetail } from "@/components/users/user-detail";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function UserDetailPage({
  params,
}: {
  params: { uid: string };
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  const data = await getUserDetail(params.uid);
  if (!data.user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/users"
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">User Profile</h1>
      </div>

      <UserDetail
        user={data.user}
        posts={data.posts}
        reports={data.reports}
        adminUid={admin.uid}
        adminEmail={admin.email}
      />
    </div>
  );
}
