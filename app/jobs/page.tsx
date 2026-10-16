import { notFound } from "next/navigation";
import { requireUser } from "../session";

export default async function JobsPage() {
  await requireUser();
  // ponytail: a listagem de vagas ainda não existe; logado continua caindo no 404 até ela ser construída
  notFound();
}
