import { getCurrentAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return (
    <AdminShell admin={admin}>
      {children}
    </AdminShell>
  );
}
