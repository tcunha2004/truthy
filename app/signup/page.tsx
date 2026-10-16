import { AuthPage, authMetadata } from "../auth";
import { parseAuthError } from "../auth-error";

export const generateMetadata = () => authMetadata("signup");

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <AuthPage mode="signup" error={parseAuthError((await searchParams).error)} />;
}
