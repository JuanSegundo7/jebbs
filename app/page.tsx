import { getCatalog } from "@/lib/catalog/get-catalog";
import { Hero } from "@/components/landing/hero";
import { MenuSection } from "@/components/landing/menu-section";
import { InfoTabs } from "@/components/landing/info-tabs";
import { WhatsappCta } from "@/components/landing/whatsapp-cta";

export default async function HomePage() {
  const catalog = await getCatalog();

  return (
    <main>
      <Hero />
      <MenuSection catalog={catalog} deliveryFeeArs={catalog.deliveryFeeArs} />
      <InfoTabs />
      <WhatsappCta />
    </main>
  );
}
