import { Instagram, Star } from "lucide-react";

// Reviews transcribed verbatim from the reference site (jebbs-burgers.vercel.app,
// itself published for this same real business, "Jebbs Burger's"). Static
// text, same as the reference site -- no live Google Reviews API here.
//
// VERIFICAR CON EL DUEÑO ANTES DE PUBLICAR: estos textos, nombres y fechas
// no fueron confirmados en esta sesión, solo copiados del HTML del sitio
// de referencia. Confirmar que el dueño autoriza publicarlos tal cual.
const REVIEWS = [
  {
    author: "Facundo Coarasa",
    meta: "Local Guide · 44 opiniones · Feb. 2026",
    text: "Las mejores burger de la zona de Gonnet y City Bell, abundantes, ricas y a un precio muy bueno. Excelente relación precio-calidad y la atención siempre es un 10. Nunca más pedimos hamburguesas en las cadenas de comida rápida.",
  },
  {
    author: "Emma Ambrosis",
    meta: "8 opiniones · Entrega a domicilio · Abr. 2026",
    text: "Muy buenas hamburguesas! La materia prima es excelente y tienen buen precio. Los chicos que toman el pedido por wtp son lo más 🙏",
  },
  {
    author: "Mariela Massera",
    meta: "3 opiniones · Abr. 2026",
    text: "Excelente calidad y precio y la atención. Nos encanta!! Las hamburguesas bien cocidas y no son grasosas son riquísimas!!! Seguiremos pidiendo!!!",
  },
] as const;

const INSTAGRAM_URL = "https://www.instagram.com/jebbsburgers/";

// Re-estilo a la identidad real de jebbs-dashboard: tipografía nativa,
// naranja/frío en vez de mostaza/carbón. diner-rev se retinta en
// globals.css (era el último consumidor de diner-elevated en el sitio).
export function ReviewsSection() {
  return (
    <section id="opiniones" className="diner-section scroll-mt-20 bg-[var(--surface-1)]">
      <div className="diner-wrap">
        <div className="diner-sechead">
          <div className="flex items-center gap-4">
            <span className="font-sans text-[2rem] font-bold leading-none text-[var(--foreground)]">
              10,2 mil
            </span>
            <span className="font-sans text-sm font-semibold text-[var(--muted-foreground)] uppercase">
              Nos siguen en Instagram
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {REVIEWS.map((review) => (
            <figure key={review.author} className="diner-rev">
              <div className="flex gap-0.5 text-[.86rem] tracking-[.2em] text-[var(--accent-brand)]" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="font-sans text-[0.97rem] leading-[1.62] text-[var(--foreground)]">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <figcaption className="mt-auto border-t border-[var(--hairline)] pt-[13px]">
                <b className="block font-sans text-sm font-semibold text-[var(--foreground)]">
                  {review.author}
                </b>
                <span className="text-[0.79rem] text-[var(--muted-foreground-dim)]">{review.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--accent-brand)]"
        >
          <Instagram className="size-4" aria-hidden />
          @jebbsburgers
        </a>
      </div>
    </section>
  );
}
