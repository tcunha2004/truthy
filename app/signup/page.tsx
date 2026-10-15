import { AuthPage, authMetadata } from "../auth";

export const generateMetadata = () => authMetadata("signup");

export default function Page() {
  return <AuthPage mode="signup" />;
}
