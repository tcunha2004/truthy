import { AuthPage, authMetadata } from "../auth";

export const generateMetadata = () => authMetadata("login");

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <AuthPage mode="login" error={(await searchParams).error === "google"} />;
}
