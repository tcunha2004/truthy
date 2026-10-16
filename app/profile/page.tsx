import { dicts, getLang, locales } from "../i18n";
import { getProfile, saveProfile } from "../profile";
import { countryOptions } from "../profile-options";
import { requireUser } from "../session";
import { ProfileForm } from "./form";

export async function generateMetadata() {
  return { title: `${dicts[await getLang()].profile.title} · truthy` };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const lang = await getLang();
  const locale = locales[lang];
  return (
    <ProfileForm
      initial={await getProfile(user.id, user.name)}
      t={dicts[lang].ob}
      tp={dicts[lang].profile}
      locale={locale}
      countries={countryOptions(locale)}
      save={saveProfile}
    />
  );
}
