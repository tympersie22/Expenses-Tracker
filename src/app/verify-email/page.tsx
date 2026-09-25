import { AccountLinkForm } from "@/components/account-link-form";
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const { token, email } = await searchParams;
  return <AccountLinkForm mode="verify" token={token} initialEmail={email} />;
}
