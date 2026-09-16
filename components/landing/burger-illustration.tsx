interface BurgerIllustrationProps {
  className?: string;
  /** Cuando la ilustración es puramente decorativa (p.ej. la marca de agua
   * del hero, ya hay un <h1> con el nombre del producto) se pasa
   * aria-hidden y se pisa el role/aria-label del <svg>. */
  "aria-hidden"?: boolean;
}

// Ilustración SVG transcripta tal cual del sitio de referencia
// (jebbs-burgers.vercel.app) -- en el original es la animación de intro
// "armando la doble cheddar" (#intro en ref-style.css: cada capa entra con
// un keyframe propio, --ing.i1..i6-- que la deja en opacity:0 en reposo).
// Acá se usa como ilustración estática del hero: se omiten
// deliberadamente esas clases de animación (.ing/.bglow/.bimpact) porque
// sin el overlay #intro completo (splash de 2.9s, fixed inset-0, skip
// button) quedarían con su estado de reposo opacity:0 -- es decir, un
// SVG invisible. El contenido vectorial (paths, rects, gradiente radial,
// viewBox) es una transcripción fiel: mismos valores, mismos colores.
export function BurgerIllustration({
  className,
  "aria-hidden": ariaHidden,
}: BurgerIllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 300"
      role={ariaHidden ? undefined : "img"}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : "Una hamburguesa doble cheddar de Jebbs Burger's"}
    >
      <defs>
        <radialGradient id="gGlow" cx="50%" cy="52%" r="50%">
          <stop offset="0" stopColor="#F2B21C" stopOpacity=".17" />
          <stop offset=".62" stopColor="#E2622C" stopOpacity=".06" />
          <stop offset="1" stopColor="#F2B21C" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="166" rx="158" ry="132" fill="url(#gGlow)" />

      {/* pan de abajo */}
      <g>
        <rect x="64" y="200" width="192" height="32" rx="13" fill="#C98A3E" />
        <ellipse cx="160" cy="232" rx="96" ry="19" fill="#B2762F" />
        <rect x="76" y="205" width="60" height="7" rx="3.5" fill="#DCA059" opacity=".55" />
      </g>

      {/* medallón inferior */}
      <g>
        <ellipse cx="60" cy="190" rx="11" ry="8" fill="#5C3721" />
        <ellipse cx="260" cy="190" rx="11" ry="8" fill="#5C3721" />
        <rect x="56" y="176" width="208" height="26" rx="12" fill="#4B2C1C" />
        <rect x="60" y="177" width="200" height="8" rx="4" fill="#633B23" />
      </g>

      {/* cheddar inferior */}
      <g>
        <path d="M74 176 L84 199 L94 176 Z" fill="#F2B21C" />
        <path d="M148 176 L159 203 L170 176 Z" fill="#F2B21C" />
        <path d="M222 176 L231 196 L240 176 Z" fill="#F2B21C" />
        <rect x="52" y="163" width="216" height="15" rx="3" fill="#F2B21C" />
        <rect x="52" y="163" width="216" height="5" rx="2.5" fill="#F8C548" />
      </g>

      {/* medallón superior */}
      <g>
        <ellipse cx="60" cy="152" rx="11" ry="8" fill="#5C3721" />
        <ellipse cx="260" cy="152" rx="11" ry="8" fill="#5C3721" />
        <rect x="56" y="138" width="208" height="26" rx="12" fill="#4B2C1C" />
        <rect x="60" y="139" width="200" height="8" rx="4" fill="#633B23" />
      </g>

      {/* cheddar superior */}
      <g>
        <path d="M80 138 L89 159 L98 138 Z" fill="#F2B21C" />
        <path d="M156 138 L167 166 L178 138 Z" fill="#F2B21C" />
        <path d="M216 138 L226 157 L236 138 Z" fill="#F2B21C" />
        <rect x="52" y="125" width="216" height="15" rx="3" fill="#F2B21C" />
        <rect x="52" y="125" width="216" height="5" rx="2.5" fill="#F8C548" />
      </g>

      {/* pan de arriba */}
      <g>
        <path d="M62 128 C62 86 106 64 160 64 C214 64 258 86 258 128 Z" fill="#E0A254" />
        <rect x="62" y="118" width="196" height="12" rx="6" fill="#CF9040" />
        <ellipse cx="122" cy="90" rx="31" ry="13" fill="#EFBC7C" opacity=".5" />
      </g>

      <circle cx="160" cy="126" r="62" fill="none" stroke="#F2B21C" strokeWidth="3" />
    </svg>
  );
}
