import { AuthPage, authMetadata } from "../auth";
import { parseAuthError } from "../auth-error";

export const generateMetadata = () => authMetadata("login");

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <AuthPage mode="login" error={parseAuthError((await searchParams).error)} />;
}
