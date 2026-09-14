import { getCatalog, type Catalog } from "@/lib/catalog/get-catalog";

interface CatalogPreviewProps {
  catalog: Catalog;
  deliveryFeeArs: number;
}

// Placeholder entry point for WU2 (catalog read path). It exists to prove
// the server-side getCatalog() wiring end-to-end -- the real menu /
// order-builder UI (WU3) replaces this component; nothing here is meant to
// survive that phase.
function CatalogPreview({ catalog, deliveryFeeArs }: CatalogPreviewProps) {
  const summary = {
    burgers: catalog.burgers.length,
    extras: catalog.extras.length,
    combos: catalog.combos.length,
    deliveryFeeArs,
  };

  console.log("[WU2 catalog preview]", summary);

  return <pre>{JSON.stringify(summary, null, 2)}</pre>;
}

export default async function HomePage() {
  const catalog = await getCatalog();

  return <CatalogPreview catalog={catalog} deliveryFeeArs={catalog.deliveryFeeArs} />;
}
