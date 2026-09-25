import { redirect } from "next/navigation";
import { currentUser, needsEmailVerification } from "@/server/auth";
import { snapshot } from "@/server/snapshot";
import { Workspace } from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (needsEmailVerification(user)) redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  return <Workspace initial={await snapshot(user.id)} section="plan" />;
}
