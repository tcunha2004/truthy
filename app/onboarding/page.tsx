import { redirect } from "next/navigation";
import { dicts, getLang, locales } from "../i18n";
import { finish, getProfile, saveStep } from "../profile";
import { countryOptions, initialStep } from "../profile-options";
import { getUser } from "../session";
import { Wizard } from "./wizard";

export async function generateMetadata() {
  return { title: `${dicts[await getLang()].ob.title} · truthy` };
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.onboarded) redirect("/profile");
  const lang = await getLang();
  const locale = locales[lang];
  const profile = await getProfile(user.id, user.name);
  return (
    <Wizard
      initial={profile}
      start={initialStep(profile, (await searchParams).step)}
      t={dicts[lang].ob}
      locale={locale}
      countries={countryOptions(locale)}
      saveStep={saveStep}
      finish={finish}
    />
  );
}
