import { AuthForm } from "@/components/auth-form";
import { currentUser } from "@/server/auth";
import { redirect } from "next/navigation";
export default async function Login() {
  if (await currentUser()) redirect("/home");
  return <AuthForm />;
}
