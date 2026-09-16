import { Clock, MapPin, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Static shop info (hours, delivery zones, reviews). No catalog/cart state
// -- WU3's brief only asks for the shell here; content is placeholder copy
// until the shop provides the real text.
export function InfoTabs() {
  return (
    <section id="info" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-12">
      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours">
            <Clock className="size-3.5" aria-hidden />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="zones">
            <MapPin className="size-3.5" aria-hidden />
            Zonas de envío
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="size-3.5" aria-hidden />
            Opiniones
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="hours"
          className="ios-glass mt-3 rounded-2xl p-4 text-subheadline text-muted-foreground"
        >
          {/* TODO: copy real -- confirm actual opening hours with the shop */}
          Todos los días de 20:00 a 00:00hs.
        </TabsContent>
        <TabsContent
          value="zones"
          className="ios-glass mt-3 rounded-2xl p-4 text-subheadline text-muted-foreground"
        >
          Consultá tu zona al confirmar el pedido por WhatsApp.
        </TabsContent>
        <TabsContent
          value="reviews"
          className="ios-glass mt-3 rounded-2xl p-4 text-subheadline text-muted-foreground"
        >
          {/* TODO: copy real -- real customer reviews/testimonials, once available */}
          Próximamente.
        </TabsContent>
      </Tabs>
    </section>
  );
}
