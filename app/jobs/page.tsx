import { notFound, redirect } from "next/navigation";
import { getUser } from "../session";

export default async function JobsPage() {
  if (!(await getUser())) redirect("/login");
  // ponytail: a listagem de vagas ainda não existe; logado continua caindo no 404 até ela ser construída
  notFound();
}
