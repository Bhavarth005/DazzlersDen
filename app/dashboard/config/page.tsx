import { getCurrentAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import BonusConfiguration from "./bonusConfiguration";

export default async function Config() {
  const admin = await getCurrentAdmin();
  if(!admin || admin.role != "SUPERADMIN") {
    redirect("/dashboard");
  }

  return <BonusConfiguration />
}