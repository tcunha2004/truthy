import { AuthPage, authMetadata } from "../auth";

export const generateMetadata = () => authMetadata("login");

export default function Page() {
  return <AuthPage mode="login" />;
}
