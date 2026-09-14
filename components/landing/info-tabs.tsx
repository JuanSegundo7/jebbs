import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Static shop info (hours, delivery zones, reviews). No catalog/cart state
// -- WU3's brief only asks for the shell here; content is placeholder copy
// until the shop provides the real text.
export function InfoTabs() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours">Horarios</TabsTrigger>
          <TabsTrigger value="zones">Zonas de envío</TabsTrigger>
          <TabsTrigger value="reviews">Opiniones</TabsTrigger>
        </TabsList>
        <TabsContent value="hours" className="text-subheadline text-muted-foreground">
          Todos los días de 20:00 a 00:00hs.
        </TabsContent>
        <TabsContent value="zones" className="text-subheadline text-muted-foreground">
          Consultá tu zona al confirmar el pedido por WhatsApp.
        </TabsContent>
        <TabsContent value="reviews" className="text-subheadline text-muted-foreground">
          Próximamente.
        </TabsContent>
      </Tabs>
    </section>
  );
}
