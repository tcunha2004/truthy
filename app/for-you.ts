// "Para você": do perfil para a frase do embedding e os filtros duros. Puro: roda no node --test.
import { FIELD_LABELS, type Profile, type Seniority } from "./profile-options.ts";

export type ForYouFilters = { seniority: Seniority; country: string; remote: boolean; local: boolean };
export type ForYouScope = "remote" | "local" | "both";

const LEVEL_WORDS: Record<Seniority, string> = { intern: "Intern", junior: "Junior", mid: "Mid-level", senior: "Senior", staff: "Staff", manager: "Manager" };

// Quem chama só passa perfil completo (requireUser garante), então field, seniority e country não são nulos.
export const forYouFilters = (p: Profile): ForYouFilters => ({
  seniority: p.seniority!,
  country: p.country!,
  remote: p.workModels.includes("remote"),
  local: p.workModels.includes("hybrid") || p.workModels.includes("onsite"),
});

export const forYouQuery = (p: Profile) => [FIELD_LABELS[p.field!], LEVEL_WORDS[p.seniority!], ...p.stack].join(" ");

// A frase do embedding leva a stack inteira; a linha de resumo mostra só as primeiras.
export const forYouStack = (stack: string[]) => ({ shown: stack.slice(0, 6), more: Math.max(0, stack.length - 6) });

export const forYouScope = (f: ForYouFilters): ForYouScope => (f.remote && f.local ? "both" : f.remote ? "remote" : "local");
