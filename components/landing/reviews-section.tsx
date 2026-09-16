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

// Tarjetas transcriptas de ref-style.css:174-183 (.rev/.rev .stars/
// .rev .who): borde+radio 4px sobre --slab, no un simple border-t plano.
export function ReviewsSection() {
  return (
    <section id="opiniones" className="diner-section scroll-mt-20 bg-[var(--soot)]">
      <div className="diner-wrap">
        <div className="diner-sechead">
          <div className="flex items-center gap-4">
            <span className="font-display text-[2rem] leading-none text-[var(--cream)]">
              10,2 mil
            </span>
            <span className="font-condensed text-sm font-semibold tracking-[.1em] text-[var(--ash)] uppercase">
              Nos siguen en Instagram
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {REVIEWS.map((review) => (
            <figure key={review.author} className="diner-rev">
              <div className="flex gap-0.5 text-[.86rem] tracking-[.2em] text-[var(--cheddar)]" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="font-body text-[0.97rem] leading-[1.62] text-[var(--cream)]">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <figcaption className="mt-auto border-t border-[var(--line)] pt-[13px]">
                <b className="block font-condensed text-[0.84rem] font-bold tracking-[.1em] text-[var(--cream)] uppercase">
                  {review.author}
                </b>
                <span className="text-[0.79rem] text-[var(--ash-dim)]">{review.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 font-condensed text-sm font-bold tracking-[.06em] text-[var(--cream)] uppercase transition-colors hover:text-[var(--cheddar)]"
        >
          <Instagram className="size-4" aria-hidden />
          @jebbsburgers
        </a>
      </div>
    </section>
  );
}
