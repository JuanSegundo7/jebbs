import { coverageLabel } from "@/lib/catalog/coverage-text";
import { getCatalog } from "@/lib/catalog/get-catalog";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { FactsStrip } from "@/components/landing/facts-strip";
import { MenuSection } from "@/components/landing/menu-section";
import { InfoSection } from "@/components/landing/info-section";
import { ReviewsSection } from "@/components/landing/reviews-section";
import { DeliveryZoneMap } from "@/components/landing/delivery-zone-map";
import { SiteFooter } from "@/components/landing/site-footer";

// ISR: the catalog (delivery zones, prices) is edited from the dashboard;
// re-render at most every 60s so changes show up without a redeploy.
export const revalidate = 60;

export default async function HomePage() {
  const catalog = await getCatalog();
  // Best-effort hero shot: first burger that actually has a photo, else the
  // first burger (Hero falls back to a placeholder tile when its image_url
  // is still null). Purely presentational -- picks nothing that affects
  // pricing or ordering.
  const featuredBurger =
    catalog.burgers.find((burger) => burger.image_url) ?? catalog.burgers[0] ?? null;

  const coverage = coverageLabel(catalog.deliveryZones);

  return (
    <main>
      <SiteHeader />
      <Hero featuredBurger={featuredBurger} coverage={coverage} />
      <FactsStrip coverage={coverage} />
      <MenuSection
        catalog={catalog}
        deliveryZones={catalog.deliveryZones}
        minDeliveryFeeArs={catalog.minDeliveryFeeArs}
      />
      <InfoSection coverage={coverage} />
      <DeliveryZoneMap zones={catalog.deliveryZones} />
      <ReviewsSection />
      <SiteFooter coverage={coverage} />
    </main>
  );
}
