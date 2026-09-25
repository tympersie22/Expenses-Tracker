import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
export const dynamic = "force-dynamic";
export default async function Page() {
  redirect((await currentUser()) ? "/home" : "/login");
}
