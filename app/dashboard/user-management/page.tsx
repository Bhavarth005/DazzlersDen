import { getCurrentAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagement from "./userManagement";

export default async function Config() {
  const admin = await getCurrentAdmin();
  if(!admin || admin.role != "SUPERADMIN") {
    redirect("/dashboard");
  }

  return <UserManagement />
}