import { getUsers } from "@/app/actions/users";
import { getCurrentAdmin } from "@/app/actions/auth";
import { UsersTable } from "@/components/users/users-table";

export default async function UsersPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  const searchParams = await props.searchParams;

  const filters = {
    search: searchParams.search,
    sortBy: (searchParams.sortBy as "points" | "joinedAt") ?? "joinedAt",
    sortDir: (searchParams.sortDir as "asc" | "desc") ?? "desc",
  };

  const users = await getUsers(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">User Management</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage platform users and view profiles</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <UsersTable initialUsers={users} filters={filters} />
      </div>
    </div>
  );
}
