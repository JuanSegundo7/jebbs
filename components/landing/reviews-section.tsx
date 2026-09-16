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

export function ReviewsSection() {
  return (
    <section id="opiniones" className="scroll-mt-20 bg-[var(--soot)] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 font-display text-3xl text-[var(--cream)] sm:text-4xl">
          Opiniones
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {REVIEWS.map((review) => (
            <figure
              key={review.author}
              className="space-y-3 border-t border-[var(--line)] pt-4"
            >
              <div className="flex gap-0.5 text-[var(--cheddar)]" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="font-body text-sm text-[var(--ash)]">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <figcaption className="font-condensed text-xs font-bold tracking-[.06em] text-[var(--cream)] uppercase">
                {review.author}
                <span className="block font-body text-[11px] font-normal tracking-normal text-[var(--ash-dim)] normal-case">
                  {review.meta}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 font-condensed text-sm font-bold tracking-[.06em] text-[var(--cream)] uppercase transition-colors hover:text-[var(--cheddar)]"
        >
          <Instagram className="size-4" aria-hidden />
          10,2 mil seguidores en Instagram
        </a>
      </div>
    </section>
  );
}
