import { AccountLinkForm } from "@/components/account-link-form";
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return token ? <AccountLinkForm mode="reset" token={token} /> : <AccountLinkForm mode="forgot" />;
}
