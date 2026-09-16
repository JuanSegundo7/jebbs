import { getCatalog } from "@/lib/catalog/get-catalog";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { MenuSection } from "@/components/landing/menu-section";
import { InfoTabs } from "@/components/landing/info-tabs";
import { WhatsappCta } from "@/components/landing/whatsapp-cta";

export default async function HomePage() {
  const catalog = await getCatalog();
  // Best-effort hero shot: first burger that actually has a photo, else the
  // first burger (Hero falls back to a placeholder tile when its image_url
  // is still null). Purely presentational -- picks nothing that affects
  // pricing or ordering.
  const featuredBurger =
    catalog.burgers.find((burger) => burger.image_url) ?? catalog.burgers[0] ?? null;

  return (
    <main>
      <SiteHeader />
      <Hero featuredBurger={featuredBurger} />
      <MenuSection catalog={catalog} deliveryFeeArs={catalog.deliveryFeeArs} />
      <InfoTabs />
      <WhatsappCta />
    </main>
  );
}
